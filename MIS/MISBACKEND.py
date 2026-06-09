from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Query
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import xlrd
import json
import os
import shutil
from datetime import datetime
from typing import List, Dict, Optional
import asyncio
from enum import Enum
import uuid
import sqlite3
import copy
import io
import base64
import sys

app = FastAPI(title="MIS Backend - Excel Processing System")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment detection for Vercel
IS_VERCEL = os.environ.get('VERCEL') == '1'
DATA_DIR = "/tmp" if IS_VERCEL else os.path.dirname(os.path.abspath(__file__))

# SQLite Database
DB_PATH = os.path.join(DATA_DIR, "clients.db")

def get_db():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("PRAGMA foreign_keys=ON")
    return db

def init_db():
    db = get_db()
    db.execute("""
        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fileNo TEXT DEFAULT '',
            ntn TEXT DEFAULT '',
            name TEXT DEFAULT '',
            cnic TEXT DEFAULT '',
            irisPin TEXT DEFAULT '',
            irisPassword TEXT DEFAULT '',
            email TEXT DEFAULT '',
            emailPassword TEXT DEFAULT '',
            phone TEXT DEFAULT '',
            address TEXT DEFAULT '',
            city TEXT DEFAULT '',
            person TEXT DEFAULT '',
            sourceOfIncome TEXT DEFAULT '',
            businessClassification TEXT DEFAULT '',
            status TEXT DEFAULT 'Active',
            taxYear TEXT DEFAULT '',
            returns INTEGER DEFAULT 0,
            totalRevenue TEXT DEFAULT '$0',
            lastContact TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            tags TEXT DEFAULT '[]',
            assignedTo TEXT DEFAULT 'Admin User',
            avatar TEXT,
            timeline TEXT DEFAULT '[]'
        )
    """)
    db.commit()

    db.execute("""
        CREATE TABLE IF NOT EXISTS tax_returns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER DEFAULT 0,
            client_name TEXT DEFAULT '',
            cnic TEXT DEFAULT '',
            ntn TEXT DEFAULT '',
            tax_year TEXT DEFAULT '',
            total_income TEXT DEFAULT '',
            taxable_income TEXT DEFAULT '',
            tax_chargeable TEXT DEFAULT '',
            tax_paid TEXT DEFAULT '',
            refund_amount TEXT DEFAULT '',
            refund_section TEXT DEFAULT '',
            return_type TEXT DEFAULT 'Section 114(1) - Voluntary Return',
            original_filename TEXT DEFAULT '',
            filing_date TEXT DEFAULT '',
            processed_date TEXT DEFAULT '',
            status TEXT DEFAULT 'Pending',
            notes TEXT DEFAULT '',
            file_data BLOB DEFAULT NULL,
            file_type TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    """)
    db.commit()

    # Migrate from JSON if table is empty
    count = db.execute("SELECT COUNT(*) FROM clients").fetchone()[0]
    if count == 0:
        json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "clientsData.json")
        if os.path.exists(json_path):
            try:
                with open(json_path, encoding="utf-8") as f:
                    clients = json.load(f)
                for c in clients:
                    db.execute("""
                        INSERT INTO clients (
                            fileNo, ntn, name, cnic, irisPin, irisPassword, email, emailPassword,
                            phone, address, city, person, sourceOfIncome, businessClassification,
                            status, taxYear, returns, totalRevenue, lastContact, notes, tags,
                            assignedTo, avatar, timeline
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        c.get("fileNo", ""), c.get("ntn", ""), c.get("name", ""), c.get("cnic", ""),
                        c.get("irisPin", ""), c.get("irisPassword", ""), c.get("email", ""),
                        c.get("emailPassword", ""), c.get("phone", ""), c.get("address", ""),
                        c.get("city", ""), c.get("person", ""), c.get("sourceOfIncome", ""),
                        c.get("businessClassification", ""), c.get("status", "Active"),
                        c.get("taxYear", ""), c.get("returns", 0), c.get("totalRevenue", "$0"),
                        c.get("lastContact", ""), c.get("notes", ""), json.dumps(c.get("tags", [])),
                        c.get("assignedTo", "Admin User"), c.get("avatar"),
                        json.dumps(c.get("timeline", []))
                    ))
                db.commit()
                print(f"Migrated {len(clients)} clients from JSON to SQLite")
            except Exception as e:
                print(f"Warning: Could not migrate JSON data: {e}")
    db.close()

init_db()

# Pydantic model for client API
class ClientModel(BaseModel):
    fileNo: str = ""
    ntn: str = ""
    name: str = ""
    cnic: str = ""
    irisPin: str = ""
    irisPassword: str = ""
    email: str = ""
    emailPassword: str = ""
    phone: str = ""
    address: str = ""
    city: str = ""
    person: str = ""
    sourceOfIncome: str = ""
    businessClassification: str = ""
    status: str = "Active"
    taxYear: str = ""
    totalRevenue: str = "$0"
    notes: str = ""
    tags: list = []
    assignedTo: str = "Admin User"
    avatar: Optional[str] = None
    timeline: list = []

# Directories
UPLOAD_DIR = os.path.join(DATA_DIR, "uploads")
OUTPUT_DIR = os.path.join(DATA_DIR, "outputs")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
QUEUE_FILE = os.path.join(DATA_DIR, "processing_queue.json")

for dir_path in [UPLOAD_DIR, OUTPUT_DIR, PROCESSED_DIR]:
    os.makedirs(dir_path, exist_ok=True)

# Processing Queue and Status

def load_queue() -> Dict[str, dict]:
    if os.path.exists(QUEUE_FILE):
        try:
            with open(QUEUE_FILE, encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load queue file: {e}")
    return {}

def save_queue():
    try:
        with open(QUEUE_FILE, "w", encoding="utf-8") as f:
            json.dump(processing_queue, f, indent=2, default=str)
    except Exception as e:
        print(f"Error saving queue: {e}")

processing_queue: Dict[str, dict] = load_queue()

class ProcessingStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

processing_queue: Dict[str, dict] = {}


# Models
class ProcessingResponse(BaseModel):
    job_id: str
    status: str
    message: str
    filename: str


class JobStatus(BaseModel):
    job_id: str
    status: str
    progress: int
    filename: str
    message: str
    download_url: Optional[str] = None
    error: Optional[str] = None
    client_name: Optional[str] = None
    client_ntn: Optional[str] = None
    tax_year: Optional[str] = None


# -------------------------------
# Client Database Lookup (SQLite)
# -------------------------------

def row_to_dict(row):
    if row is None:
        return None
    d = dict(row)
    if isinstance(d.get("tags"), str):
        d["tags"] = json.loads(d["tags"]) if d["tags"] else []
    if isinstance(d.get("timeline"), str):
        d["timeline"] = json.loads(d["timeline"]) if d["timeline"] else []
    return d

def find_client_by_reg_no(reg_no: str):
    """Search client database by registration number (matches ntn or cnic)."""
    if not reg_no:
        return None
    reg_clean = str(reg_no).replace("-", "").replace(" ", "").strip().lstrip("0")
    db = get_db()
    rows = db.execute("SELECT * FROM clients").fetchall()
    db.close()
    for r in rows:
        c = dict(r)
        ntn_raw = str(c.get("ntn", ""))
        cnic_raw = str(c.get("cnic", ""))
        ntn_clean = ntn_raw.replace("-", "").replace(" ", "").strip().lstrip("0")
        cnic_clean = cnic_raw.replace("-", "").replace(" ", "").strip().lstrip("0")
        if ntn_clean == reg_clean or cnic_clean == reg_clean:
            return row_to_dict(r)
        ntn_prefix = ntn_raw.strip().split("-")[0].lstrip("0") if "-" in ntn_raw else ntn_clean
        cnic_prefix = cnic_raw.strip().split("-")[0].lstrip("0") if "-" in cnic_raw else cnic_clean
        if ntn_prefix and ntn_prefix == reg_clean:
            return row_to_dict(r)
        if cnic_prefix and cnic_prefix == reg_clean:
            return row_to_dict(r)
    return None


# -------------------------------
# Helper: Read .xls or .xlsx into openpyxl Workbook
# -------------------------------
def read_excel_to_openpyxl(file_path: str):
    """
    Read any Excel file (.xls or .xlsx) into an openpyxl Workbook.
    Uses xlrd for old .xls format and openpyxl for .xlsx.
    """
    if file_path.lower().endswith('.xls') and not file_path.lower().endswith('.xlsx'):
        # Open with xlrd
        wb_old = xlrd.open_workbook(file_path)
        ws_old = wb_old.sheet_by_index(0)

        # Create new openpyxl workbook
        wb_new = openpyxl.Workbook()
        ws_new = wb_new.active

        # Copy data (including formatting hints as plain values)
        for row_idx in range(ws_old.nrows):
            for col_idx in range(ws_old.ncols):
                cell = ws_old.cell(row_idx, col_idx)
                val = cell.value
                # xlrd returns Excel date floats; convert to readable string
                if cell.ctype == 3:  # XL_CELL_DATE
                    date_tuple = xlrd.xldate_as_tuple(val, wb_old.datemode)
                    # Keep as formatted string for clarity
                    if date_tuple[:3] == (0, 0, 0):
                        val = f"{date_tuple[3]:02d}:{date_tuple[4]:02d}:{date_tuple[5]:02d}"
                    else:
                        val = f"{date_tuple[0]:04d}-{date_tuple[1]:02d}-{date_tuple[2]:02d}"
                elif cell.ctype == 2 and val is not None:  # XL_CELL_NUMBER
                    # Convert ALL whole-number floats to int/str to avoid .0 in output
                    if isinstance(val, float) and abs(val) >= 1e10:
                        val = str(int(round(val)))
                    elif isinstance(val, float) and val == int(val):
                        val = int(val)
                elif val is None:
                    val = None
                else:
                    val = cell.value
                ws_new.cell(row=row_idx + 1, column=col_idx + 1, value=val)

        return wb_new
    else:
        return openpyxl.load_workbook(file_path)


# -------------------------------
# Core Processing Function
# -------------------------------
def process_excel_file(job_id: str, file_path: str, original_filename: str):
    """
    Main Excel processing function with all requirements
    """
    try:
        # Update status
        processing_queue[job_id]["status"] = ProcessingStatus.PROCESSING
        processing_queue[job_id]["progress"] = 10
        processing_queue[job_id]["message"] = "Opening Excel file..."

        # Open workbook (supports both .xls and .xlsx)
        wb = read_excel_to_openpyxl(file_path)
        ws = wb.active

        # Look up client info from Registration No
        processing_queue[job_id]["message"] = "Looking up client information..."
        client_name = ""
        client_ntn = ""
        reg_number = ""
        tax_year = ""
        header_row = ws[1]

        # Find Registration No and Tax Year columns by header (flexible match)
        reg_col_idx = None
        tax_year_col_idx = None
        for idx, cell in enumerate(header_row, start=1):
            if cell.value:
                header_text = str(cell.value).strip().lower()
                if "registration no" in header_text:
                    reg_col_idx = idx
                elif "tax year" in header_text:
                    tax_year_col_idx = idx

        # Read first non-empty Registration No
        if reg_col_idx:
            for row_idx in range(2, ws.max_row + 1):
                val = ws.cell(row_idx, reg_col_idx).value
                if val is not None:
                    if isinstance(val, float):
                        reg_number = str(int(round(val))) if abs(val) >= 1e10 else str(int(val))
                    elif isinstance(val, int):
                        reg_number = str(val)
                    else:
                        reg_raw = str(val).strip()
                        if reg_raw:
                            reg_number = reg_raw
                    if reg_number:
                        break

        # Read first non-empty Tax Year from the same data row
        if tax_year_col_idx and reg_col_idx:
            for row_idx in range(2, ws.max_row + 1):
                val = ws.cell(row_idx, tax_year_col_idx).value
                if val is not None:
                    if isinstance(val, (int, float)):
                        tax_year = str(int(val)) if val == int(val) else str(val)
                    else:
                        ty = str(val).strip()
                        if ty:
                            tax_year = ty
                    break

        # Look up client in database
        if reg_number:
            client = find_client_by_reg_no(reg_number)
            if client:
                client_name = client.get("name", "")
                client_ntn = client.get("ntn", "")
                processing_queue[job_id]["message"] = f"Found client: {client_name}"

        # Store client info for job status response
        processing_queue[job_id]["client_name"] = client_name
        processing_queue[job_id]["client_ntn"] = client_ntn if client_ntn else reg_number
        processing_queue[job_id]["tax_year"] = tax_year

        processing_queue[job_id]["progress"] = 20
        processing_queue[job_id]["message"] = "Removing unnecessary columns..."

        # Step 1: Keep only required columns
        keep_column_names = [
            "wa name", "registration no", "section", "tax month",
            "taxable amount", "paid amount", "payment date", "tax year"
        ]

        # Find column indices to keep (flexible header matching)
        header_row = ws[1]
        columns_to_keep = []
        column_map = {}

        for idx, cell in enumerate(header_row, start=1):
            if cell.value:
                header_normalized = str(cell.value).strip().lower()
                for keep_name in keep_column_names:
                    if header_normalized == keep_name:
                        columns_to_keep.append(idx)
                        column_map[cell.value] = idx
                        break

        # Delete columns not in keep list (in reverse to avoid index shifting)
        for col_idx in range(ws.max_column, 0, -1):
            if col_idx not in columns_to_keep:
                ws.delete_cols(col_idx)

        processing_queue[job_id]["progress"] = 35
        processing_queue[job_id]["message"] = "Removing empty rows between header and data..."

        # Remove completely empty rows between header (row 1) and first data row
        row_to_check = 2
        while row_to_check <= ws.max_row:
            row_values = [ws.cell(row_to_check, c).value for c in range(1, ws.max_column + 1)]
            if all(v is None or (isinstance(v, str) and v.strip() == '') for v in row_values):
                ws.delete_rows(row_to_check)
            else:
                break

        processing_queue[job_id]["progress"] = 40
        processing_queue[job_id]["message"] = "Converting text numbers to numeric format..."

        # Step 2: Convert text numbers to numeric in Taxable Amount and Paid Amount
        # Find column positions after deletion
        new_header = {cell.value: idx for idx, cell in enumerate(ws[1], start=1)}
        
        taxable_col = new_header.get("Taxable Amount")
        paid_col = new_header.get("Paid Amount")

        if taxable_col and paid_col:
            for row_idx in range(2, ws.max_row + 1):
                # Taxable Amount
                cell = ws.cell(row_idx, taxable_col)
                if cell.value:
                    try:
                        # Remove commas and convert to number
                        cleaned_value = str(cell.value).replace(",", "").replace(" ", "")
                        cell.value = float(cleaned_value)
                        cell.number_format = '#,##0.00'
                    except:
                        pass

                # Paid Amount
                cell = ws.cell(row_idx, paid_col)
                if cell.value:
                    try:
                        cleaned_value = str(cell.value).replace(",", "").replace(" ", "")
                        cell.value = float(cleaned_value)
                        cell.number_format = '#,##0.00'
                    except:
                        pass

        processing_queue[job_id]["progress"] = 60
        processing_queue[job_id]["message"] = "Sorting data by Section..."

        # Step 3: Sort by Section column (Column B / 2nd column)
        section_col = new_header.get("Section", 2)
        
        # Get all data rows (excluding header)
        data_rows = []
        for row in ws.iter_rows(min_row=2, max_row=ws.max_row):
            data_rows.append([cell.value for cell in row])

        # Sort by Section column
        data_rows.sort(key=lambda x: str(x[section_col - 1] if x[section_col - 1] else ""))

        # Clear existing data (keep header)
        for row_idx in range(ws.max_row, 1, -1):
            ws.delete_rows(row_idx)

        # Write sorted data back
        for row_data in data_rows:
            ws.append(row_data)

        processing_queue[job_id]["progress"] = 75
        processing_queue[job_id]["message"] = "Adding section totals..."

        # Step 4: Group by Section and add totals
        current_row = 2
        section_col_idx = section_col
        
        # Refresh column positions
        new_header = {cell.value: idx for idx, cell in enumerate(ws[1], start=1)}
        taxable_col_idx = new_header.get("Taxable Amount")
        paid_col_idx = new_header.get("Paid Amount")
        wa_name_col_idx = new_header.get("Wa Name")

        while current_row <= ws.max_row:
            # Get current section
            current_section = ws.cell(current_row, section_col_idx).value
            
            if not current_section:
                current_row += 1
                continue

            # Find end of this section group
            group_start = current_row
            group_end = current_row
            
            while group_end <= ws.max_row:
                section_value = ws.cell(group_end, section_col_idx).value
                if section_value != current_section:
                    group_end -= 1
                    break
                group_end += 1
            else:
                group_end = ws.max_row

            # Calculate totals for this group
            taxable_total = 0
            paid_total = 0

            for row_idx in range(group_start, group_end + 1):
                taxable_val = ws.cell(row_idx, taxable_col_idx).value
                paid_val = ws.cell(row_idx, paid_col_idx).value

                if taxable_val and isinstance(taxable_val, (int, float)):
                    taxable_total += taxable_val
                if paid_val and isinstance(paid_val, (int, float)):
                    paid_total += paid_val

            # Get representative Wa Name from the first row of the group
            group_wa_name = ws.cell(group_start, wa_name_col_idx).value if wa_name_col_idx else None

            # Insert 1 blank row after the group
            ws.insert_rows(group_end + 1, 1)

            # Add totals in the blank row
            total_row = group_end + 1

            # Write Section and Wa Name with TOTAL label into the total row
            if wa_name_col_idx:
                # Use the Wa Name from first row of the group
                ws.cell(total_row, wa_name_col_idx).value = group_wa_name if group_wa_name else ""
            
            # Write the section name in Section column
            ws.cell(total_row, section_col_idx).value = f"TOTAL - {current_section}"

            # Write totals
            ws.cell(total_row, taxable_col_idx).value = taxable_total
            ws.cell(total_row, taxable_col_idx).number_format = '#,##0.00'

            ws.cell(total_row, paid_col_idx).value = paid_total
            ws.cell(total_row, paid_col_idx).number_format = '#,##0.00'

            # Format total row - Bold, yellow background, border across the whole row
            thick_border = Border(
                top=Side(style='medium', color='000000'),
                bottom=Side(style='medium', color='000000'),
                left=Side(style='medium', color='000000'),
                right=Side(style='medium', color='000000')
            )
            yellow_fill = PatternFill(start_color="FFF2A8", end_color="FFF2A8", fill_type="solid")

            for col_idx in range(1, ws.max_column + 1):
                cell = ws.cell(total_row, col_idx)
                cell.font = Font(bold=True, size=11)
                cell.fill = yellow_fill
                cell.border = thick_border
                if col_idx in [taxable_col_idx, paid_col_idx]:
                    cell.alignment = Alignment(horizontal="right")

            # Move to next section (skip the 1 blank row we inserted)
            current_row = group_end + 2

        processing_queue[job_id]["progress"] = 88
        processing_queue[job_id]["message"] = "Cleaning registration numbers..."

        # Clean .0 from Registration No column in data
        reg_col_idx_data = None
        for idx, cell in enumerate(ws[1], start=1):
            if cell.value and "registration no" in str(cell.value).strip().lower():
                reg_col_idx_data = idx
                break
        if reg_col_idx_data:
            for row_idx in range(2, ws.max_row + 1):
                cell = ws.cell(row_idx, reg_col_idx_data)
                val = cell.value
                if val is not None:
                    if isinstance(val, float):
                        if abs(val) >= 1e10:
                            cell.value = str(int(round(val)))
                        elif val == int(val):
                            cell.value = int(val)
                    elif isinstance(val, str) and val.endswith(".0"):
                        cell.value = val[:-2]

        processing_queue[job_id]["progress"] = 90
        processing_queue[job_id]["message"] = "Adding client header..."

        # Insert client info header at top (3 rows)
        if client_name or reg_number:
            ws.insert_rows(1, 3)

            # Merge A1:G3 and set header text
            ws.merge_cells(start_row=1, start_column=1, end_row=3, end_column=7)

            header_text = f"Name: {client_name}" if client_name else ""
            if reg_number:
                if header_text:
                    header_text += "\n"
                header_text += f"Reg No.: {reg_number}"

            header_cell = ws.cell(1, 1)
            header_cell.value = header_text
            header_cell.font = Font(bold=True, size=18, underline="single")
            header_cell.fill = PatternFill(start_color="F2F2F2", end_color="F2F2F2", fill_type="solid")
            header_cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            header_cell.border = Border(
                top=Side(style="thin", color="000000"),
                bottom=Side(style="thin", color="000000"),
                left=Side(style="thin", color="000000"),
                right=Side(style="thin", color="000000")
            )

            # Set row heights for header rows
            for r in range(1, 4):
                ws.row_dimensions[r].height = 30

        processing_queue[job_id]["progress"] = 93
        processing_queue[job_id]["message"] = "Applying borders to non-empty cells..."

        # Apply thin borders to non-empty cells only in the entire used range
        thin_border = Border(
            top=Side(style="thin", color="000000"),
            bottom=Side(style="thin", color="000000"),
            left=Side(style="thin", color="000000"),
            right=Side(style="thin", color="000000")
        )
        for row in ws.iter_rows(min_row=1, max_row=ws.max_row, max_col=ws.max_column):
            for cell in row:
                if cell.value is not None and str(cell.value).strip() != "":
                    cell.border = thin_border

        # Auto-fit column widths so values don't show as ###
        for col_idx in range(1, ws.max_column + 1):
            max_length = 0
            for row_idx in range(1, ws.max_row + 1):
                cell_value = ws.cell(row_idx, col_idx).value
                if cell_value is not None:
                    cell_length = len(str(cell_value))
                    if cell_length > max_length:
                        max_length = cell_length
            ws.column_dimensions[get_column_letter(col_idx)].width = min(max_length + 2, 50)

        processing_queue[job_id]["progress"] = 95
        processing_queue[job_id]["message"] = "Saving processed file..."

        # Save processed file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"processed_{timestamp}_{original_filename}"
        output_path = os.path.join(PROCESSED_DIR, output_filename)

        wb.save(output_path)
        wb.close()

        # Clean up upload file
        if os.path.exists(file_path):
            os.remove(file_path)

        # Update status to completed
        processing_queue[job_id]["status"] = ProcessingStatus.COMPLETED
        processing_queue[job_id]["progress"] = 100
        processing_queue[job_id]["message"] = "Processing completed successfully!"
        processing_queue[job_id]["output_file"] = output_filename
        processing_queue[job_id]["download_url"] = f"/download/{job_id}"
        save_queue()

    except Exception as e:
        # Update status to failed
        processing_queue[job_id]["status"] = ProcessingStatus.FAILED
        processing_queue[job_id]["progress"] = 0
        processing_queue[job_id]["message"] = "Processing failed"
        processing_queue[job_id]["error"] = str(e)
        save_queue()


# -------------------------------
# API Endpoints
# -------------------------------

@app.get("/")
async def root():
    return {
        "message": "MIS Backend - Excel Processing System",
        "version": "2.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "message": "MIS Backend is running",
        "queue_size": len(processing_queue)
    }


@app.post("/upload", response_model=List[ProcessingResponse])
async def upload_files(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...)
):
    """
    Upload multiple Excel files for processing
    Files are added to queue and processed in background
    """
    responses = []

    for file in files:
        # Validate file type
        if not file.filename.endswith(('.xlsx', '.xls')):
            responses.append(ProcessingResponse(
                job_id="",
                status="failed",
                message="Invalid file type. Only .xlsx and .xls files are supported.",
                filename=file.filename
            ))
            continue

        # Generate unique job ID
        job_id = str(uuid.uuid4())

        # Save uploaded file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        upload_filename = f"{timestamp}_{file.filename}"
        upload_path = os.path.join(UPLOAD_DIR, upload_filename)

        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Add to queue
        processing_queue[job_id] = {
            "job_id": job_id,
            "filename": file.filename,
            "status": ProcessingStatus.QUEUED,
            "progress": 0,
            "message": "File uploaded, waiting in queue...",
            "uploaded_at": datetime.now().isoformat(),
            "output_file": None,
            "download_url": None,
            "error": None,
            "client_name": None,
            "client_ntn": None,
            "tax_year": None
        }

        # Save queue immediately so job survives restart
        save_queue()

        # Add processing task to background
        background_tasks.add_task(process_excel_file, job_id, upload_path, file.filename)

        responses.append(ProcessingResponse(
            job_id=job_id,
            status="queued",
            message="File added to processing queue",
            filename=file.filename
        ))

    return responses


@app.get("/status/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    """
    Get processing status of a job
    """
    if job_id not in processing_queue:
        raise HTTPException(status_code=404, detail="Job not found")

    job = processing_queue[job_id]
    
    return JobStatus(
        job_id=job["job_id"],
        status=job["status"],
        progress=job["progress"],
        filename=job["filename"],
        message=job["message"],
        download_url=job.get("download_url"),
        error=job.get("error"),
        client_name=job.get("client_name"),
        client_ntn=job.get("client_ntn"),
        tax_year=job.get("tax_year")
    )


@app.get("/queue")
async def get_queue_status():
    """
    Get status of all jobs in queue
    """
    return {
        "total_jobs": len(processing_queue),
        "jobs": list(processing_queue.values())
    }


@app.get("/download/{job_id}")
async def download_processed_file(job_id: str):
    """
    Download processed Excel file
    """
    if job_id not in processing_queue:
        raise HTTPException(status_code=404, detail="Job not found")

    job = processing_queue[job_id]

    if job["status"] != ProcessingStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="File processing not completed yet")

    output_file = job.get("output_file")
    if not output_file:
        raise HTTPException(status_code=404, detail="Processed file not found")

    file_path = os.path.join(PROCESSED_DIR, output_file)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")

    return FileResponse(
        file_path,
        filename=output_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@app.delete("/job/{job_id}")
async def delete_job(job_id: str):
    """
    Delete a job from queue and remove its files
    """
    if job_id not in processing_queue:
        raise HTTPException(status_code=404, detail="Job not found")

    job = processing_queue[job_id]

    # Delete output file if exists
    if job.get("output_file"):
        file_path = os.path.join(PROCESSED_DIR, job["output_file"])
        if os.path.exists(file_path):
            os.remove(file_path)

    # Remove from queue
    del processing_queue[job_id]
    save_queue()

    return {"message": "Job deleted successfully"}


@app.delete("/clear-completed")
async def clear_completed_jobs():
    """
    Clear all completed jobs from queue
    """
    completed_jobs = [
        job_id for job_id, job in processing_queue.items()
        if job["status"] == ProcessingStatus.COMPLETED
    ]

    for job_id in completed_jobs:
        del processing_queue[job_id]
    save_queue()

    return {
        "message": f"Cleared {len(completed_jobs)} completed jobs",
        "cleared_count": len(completed_jobs)
    }


# -------------------------------
# Client CRUD API (SQLite)
# -------------------------------

@app.get("/api/clients/next-file-no")
async def get_next_file_no():
    """Get the next available file number."""
    db = get_db()
    row = db.execute("SELECT MAX(CAST(fileNo AS INTEGER)) as max_no FROM clients").fetchone()
    db.close()
    next_no = (row["max_no"] or 0) + 1
    return {"nextFileNo": str(next_no)}


@app.get("/api/clients")
async def get_clients(search: Optional[str] = Query(None)):
    """Get all clients, optionally filtered by search query."""
    db = get_db()
    if search:
        q = f"%{search}%"
        rows = db.execute("""
            SELECT * FROM clients
            WHERE name LIKE ? OR ntn LIKE ? OR cnic LIKE ? OR phone LIKE ? OR email LIKE ?
            ORDER BY name ASC
        """, (q, q, q, q, q)).fetchall()
    else:
        rows = db.execute("SELECT * FROM clients ORDER BY name ASC").fetchall()
    db.close()
    return [row_to_dict(r) for r in rows]


@app.get("/api/clients/{client_id}")
async def get_client(client_id: int):
    """Get a single client by ID."""
    db = get_db()
    row = db.execute("SELECT * FROM clients WHERE id = ?", (client_id,)).fetchone()
    db.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Client not found")
    return row_to_dict(row)


@app.post("/api/clients")
async def create_client(client: ClientModel):
    """Create a new client."""
    db = get_db()
    cursor = db.execute("""
        INSERT INTO clients (
            fileNo, ntn, name, cnic, irisPin, irisPassword, email, emailPassword,
            phone, address, city, person, sourceOfIncome, businessClassification,
            status, taxYear, returns, totalRevenue, lastContact, notes, tags,
            assignedTo, avatar, timeline
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        client.fileNo, client.ntn, client.name, client.cnic, client.irisPin,
        client.irisPassword, client.email, client.emailPassword, client.phone,
        client.address, client.city, client.person, client.sourceOfIncome,
        client.businessClassification, client.status, client.taxYear, 0,
        client.totalRevenue, datetime.now().strftime("%Y-%m-%d"), client.notes,
        json.dumps(client.tags), client.assignedTo, client.avatar,
        json.dumps(client.timeline)
    ))
    client_id = cursor.lastrowid
    db.commit()
    row = db.execute("SELECT * FROM clients WHERE id = ?", (client_id,)).fetchone()
    db.close()
    return row_to_dict(row)


@app.put("/api/clients/{client_id}")
async def update_client(client_id: int, client: ClientModel):
    """Update an existing client."""
    db = get_db()
    existing = db.execute("SELECT * FROM clients WHERE id = ?", (client_id,)).fetchone()
    if existing is None:
        db.close()
        raise HTTPException(status_code=404, detail="Client not found")

    db.execute("""
        UPDATE clients SET
            fileNo=?, ntn=?, name=?, cnic=?, irisPin=?, irisPassword=?, email=?,
            emailPassword=?, phone=?, address=?, city=?, person=?, sourceOfIncome=?,
            businessClassification=?, status=?, taxYear=?, totalRevenue=?, notes=?,
            tags=?, assignedTo=?, avatar=?, timeline=?
        WHERE id=?
    """, (
        client.fileNo, client.ntn, client.name, client.cnic, client.irisPin,
        client.irisPassword, client.email, client.emailPassword, client.phone,
        client.address, client.city, client.person, client.sourceOfIncome,
        client.businessClassification, client.status, client.taxYear,
        client.totalRevenue, client.notes, json.dumps(client.tags),
        client.assignedTo, client.avatar, json.dumps(client.timeline),
        client_id
    ))
    db.commit()
    row = db.execute("SELECT * FROM clients WHERE id = ?", (client_id,)).fetchone()
    db.close()
    return row_to_dict(row)


@app.delete("/api/clients/{client_id}")
async def delete_client(client_id: int):
    """Delete a client."""
    db = get_db()
    existing = db.execute("SELECT * FROM clients WHERE id = ?", (client_id,)).fetchone()
    if existing is None:
        db.close()
        raise HTTPException(status_code=404, detail="Client not found")
    db.execute("DELETE FROM clients WHERE id = ?", (client_id,))
    db.commit()
    db.close()
    return {"message": "Client deleted successfully", "id": client_id}


# -------------------------------
# Tax Returns Model & CRUD API
# -------------------------------

class ReturnModel(BaseModel):
    client_id: int = 0
    client_name: str = ""
    cnic: str = ""
    ntn: str = ""
    tax_year: str = ""
    total_income: str = ""
    taxable_income: str = ""
    tax_chargeable: str = ""
    tax_paid: str = ""
    refund_amount: str = ""
    refund_section: str = ""
    return_type: str = "Section 114(1) - Voluntary Return"
    original_filename: str = ""
    filing_date: str = ""
    processed_date: str = ""
    status: str = "Pending"
    notes: str = ""


def return_row_to_dict(row):
    if row is None:
        return None
    d = dict(row)
    if "file_data" in d:
        d["file_data"] = base64.b64encode(d["file_data"]).decode("utf-8") if d["file_data"] else None
    return d


@app.get("/api/returns")
async def get_returns(search: Optional[str] = Query(None)):
    db = get_db()
    if search:
        q = f"%{search}%"
        rows = db.execute("""
            SELECT id, client_id, client_name, cnic, ntn, tax_year,
                   total_income, taxable_income, tax_chargeable, tax_paid,
                   refund_amount, refund_section, return_type, original_filename,
                   filing_date, processed_date, status, notes,
                   file_type, created_at, updated_at
            FROM tax_returns
            WHERE client_name LIKE ? OR cnic LIKE ? OR ntn LIKE ? OR tax_year LIKE ?
            ORDER BY created_at DESC
        """, (q, q, q, q)).fetchall()
    else:
        rows = db.execute("""
            SELECT id, client_id, client_name, cnic, ntn, tax_year,
                   total_income, taxable_income, tax_chargeable, tax_paid,
                   refund_amount, refund_section, return_type, original_filename,
                   filing_date, processed_date, status, notes,
                   file_type, created_at, updated_at
            FROM tax_returns
            ORDER BY created_at DESC
        """).fetchall()
    db.close()
    return [dict(r) for r in rows]


@app.get("/api/returns/{return_id}")
async def get_return(return_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM tax_returns WHERE id = ?", (return_id,)).fetchone()
    db.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Return not found")
    return return_row_to_dict(row)


@app.post("/api/returns", status_code=201)
async def create_return(data: ReturnModel):
    db = get_db()
    cursor = db.execute("""
        INSERT INTO tax_returns (
            client_id, client_name, cnic, ntn, tax_year,
            total_income, taxable_income, tax_chargeable, tax_paid,
            refund_amount, refund_section, return_type, original_filename,
            filing_date, processed_date, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.client_id, data.client_name, data.cnic, data.ntn, data.tax_year,
        data.total_income, data.taxable_income, data.tax_chargeable, data.tax_paid,
        data.refund_amount, data.refund_section, data.return_type, data.original_filename,
        data.filing_date, data.processed_date, data.status, data.notes
    ))
    return_id = cursor.lastrowid
    db.commit()
    row = db.execute("SELECT * FROM tax_returns WHERE id = ?", (return_id,)).fetchone()
    db.close()
    return return_row_to_dict(row)


@app.put("/api/returns/{return_id}")
async def update_return(return_id: int, data: ReturnModel):
    db = get_db()
    existing = db.execute("SELECT id FROM tax_returns WHERE id = ?", (return_id,)).fetchone()
    if existing is None:
        db.close()
        raise HTTPException(status_code=404, detail="Return not found")
    db.execute("""
        UPDATE tax_returns SET
            client_id=?, client_name=?, cnic=?, ntn=?, tax_year=?,
            total_income=?, taxable_income=?, tax_chargeable=?, tax_paid=?,
            refund_amount=?, refund_section=?, return_type=?, original_filename=?,
            filing_date=?, processed_date=?, status=?, notes=?,
            updated_at=datetime('now')
        WHERE id=?
    """, (
        data.client_id, data.client_name, data.cnic, data.ntn, data.tax_year,
        data.total_income, data.taxable_income, data.tax_chargeable, data.tax_paid,
        data.refund_amount, data.refund_section, data.return_type, data.original_filename,
        data.filing_date, data.processed_date, data.status, data.notes,
        return_id
    ))
    db.commit()
    row = db.execute("SELECT * FROM tax_returns WHERE id = ?", (return_id,)).fetchone()
    db.close()
    return return_row_to_dict(row)


@app.delete("/api/returns/{return_id}")
async def delete_return(return_id: int):
    db = get_db()
    existing = db.execute("SELECT id FROM tax_returns WHERE id = ?", (return_id,)).fetchone()
    if existing is None:
        db.close()
        raise HTTPException(status_code=404, detail="Return not found")
    db.execute("DELETE FROM tax_returns WHERE id = ?", (return_id,))
    db.commit()
    db.close()
    return {"message": "Return deleted successfully", "id": return_id}


@app.post("/api/returns/bulk-delete")
async def bulk_delete_returns(ids: List[int]):
    if not ids:
        raise HTTPException(status_code=400, detail="No IDs provided")
    db = get_db()
    placeholders = ",".join("?" for _ in ids)
    db.execute(f"DELETE FROM tax_returns WHERE id IN ({placeholders})", ids)
    db.commit()
    db.close()
    return {"message": f"Deleted {len(ids)} returns", "count": len(ids)}


@app.post("/api/returns/upload")
async def upload_return_file(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    file_data = await file.read()
    if len(file_data) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 50MB)")

    # Extract text from PDF for auto-fill (basic)
    import re
    raw_text = ""
    try:
        import subprocess as sp
        temp_path = f"temp_{uuid.uuid4()}.pdf"
        with open(temp_path, "wb") as f:
            f.write(file_data)
        result = sp.run(
            [sys.executable, "-c", f"""
import sys
sys.path.insert(0, r"{os.path.dirname(os.path.abspath(__file__))}")
try:
    import pdfplumber
    with pdfplumber.open(r"{temp_path}") as pdf:
        for page in pdf.pages:
            print(page.extract_text() or "")
except Exception:
    pass
"""],
            capture_output=True, text=True, timeout=15
        )
        raw_text = result.stdout
        if os.path.exists(temp_path):
            os.remove(temp_path)
    except Exception:
        pass

    # Try to extract fields from text
    client_name = ""
    cnic = ""
    ntn = ""
    tax_year = ""

    if raw_text:
        lines = raw_text.split("\n")
        for i, line in enumerate(lines):
            lower = line.lower()
            if "name" in lower and not client_name:
                parts = line.split(":")
                if len(parts) > 1:
                    client_name = parts[1].strip()
            if "cnic" in lower and not cnic:
                m = re.search(r'\d{5}[-\s]?\d{7}[-\s]?\d{1}', line)
                if m:
                    cnic = m.group()
            if "ntn" in lower and not ntn:
                m = re.search(r'\d{7}[-\s]?\d{1}', line)
                if m:
                    ntn = m.group()
            if "tax year" in lower and not tax_year:
                m = re.search(r'\d{4}', line)
                if m:
                    tax_year = m.group()

    db = get_db()
    cursor = db.execute("""
        INSERT INTO tax_returns (
            client_name, cnic, ntn, tax_year, original_filename,
            filing_date, status, file_data, file_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        client_name, cnic, ntn, tax_year, file.filename,
        datetime.now().strftime("%Y-%m-%d"), "Pending",
        sqlite3.Binary(file_data), "application/pdf"
    ))
    return_id = cursor.lastrowid
    db.commit()
    row = db.execute("SELECT * FROM tax_returns WHERE id = ?", (return_id,)).fetchone()
    db.close()
    return return_row_to_dict(row)


@app.get("/api/returns/{return_id}/download")
async def download_return_file(return_id: int):
    db = get_db()
    row = db.execute("SELECT id, original_filename, file_data, file_type FROM tax_returns WHERE id = ?", (return_id,)).fetchone()
    db.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Return not found")
    if not row["file_data"]:
        raise HTTPException(status_code=404, detail="No file attached to this return")
    return Response(
        content=row["file_data"],
        media_type=row["file_type"] or "application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{row["original_filename"]}"'}
    )


if __name__ == "__main__":
    import sys
    import uvicorn
    reload_mode = "--reload" in sys.argv
    print("=" * 60)
    print("  MIS BACKEND - EXCEL PROCESSING SYSTEM")
    print("=" * 60)
    print(f"  Server starting on http://localhost:3003")
    if reload_mode:
        print("  Hot-reload: ENABLED (auto-restart on file changes)")
    print("  Upload Excel files for automatic processing")
    print("  Features:")
    print("    - Multiple file upload support")
    print("    - Queue-based processing")
    print("    - Real-time progress tracking")
    print("    - Automatic column filtering")
    print("    - Number format conversion")
    print("    - Section-wise sorting and totals")
    print("    - Auto client header from database")
    print("  Client API:")
    print("    - GET/POST /api/clients - List/Create clients")
    print("    - PUT/DELETE /api/clients/{id} - Update/Delete clients")
    print("  Returns API:")
    print("    - GET/POST /api/returns - List/Create returns")
    print("    - PUT/DELETE /api/returns/{id} - Update/Delete return")
    print("    - POST /api/returns/bulk-delete - Bulk delete returns")
    print("    - POST /api/returns/upload - Upload return PDF")
    print("    - GET /api/returns/{id}/download - Download return file")
    print("    - SQLite database: clients.db (tax_returns table)")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=3003, reload=reload_mode)
