Attribute VB_Name = "ClientDataValidation"
' ============================================
' Client Data Validation Module
' ============================================
' This module provides validation functionality for the Client Import Template
' Features:
' - Validate button to check all data rows
' - Color coding: Green (valid), Red (errors)
' - Error messages in Validation Status column
' - Clear Validation button to reset
' ============================================

Option Explicit

' Column positions (adjust if needed)
Const COL_FILE_NO = 1           ' A
Const COL_NTN = 2               ' B
Const COL_CLIENT_NAME = 3       ' C (REQUIRED)
Const COL_CNIC = 4              ' D
Const COL_PIN_IRIS = 5          ' E
Const COL_PASSWORD_IRIS = 6     ' F
Const COL_EMAIL = 7             ' G
Const COL_PASSWORD_EMAIL = 8    ' H
Const COL_PHONE = 9             ' I
Const COL_ADDRESS = 10          ' J
Const COL_BUSINESS_TYPE = 11    ' K
Const COL_STATUS = 12           ' L
Const COL_TAX_YEAR = 13         ' M
Const COL_VALIDATION_STATUS = 14 ' N (NEW COLUMN)

' Color constants
Const COLOR_GREEN = 13561798    ' Light green (#C6EFCE)
Const COLOR_RED = 13551615      ' Light red (#FFC7CE)
Const COLOR_WHITE = 16777215    ' White

' Starting row for data (after header)
Const DATA_START_ROW = 2

' ============================================
' Main Validation Function
' ============================================
Sub ValidateAllData()
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim currentRow As Long
    Dim validCount As Long
    Dim errorCount As Long
    Dim emptyCount As Long
    Dim startTime As Double
    
    ' Start timer
    startTime = Timer
    
    ' Disable screen updating for better performance
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    
    ' Get the Client Data worksheet
    Set ws = ThisWorkbook.Worksheets("Client Data")
    
    ' Find last row with data
    lastRow = ws.Cells(ws.Rows.Count, COL_CLIENT_NAME).End(xlUp).Row
    
    ' Initialize counters
    validCount = 0
    errorCount = 0
    emptyCount = 0
    
    ' Update status
    UpdateStatus ws, "Validating... Please wait..."
    
    ' Loop through all data rows
    For currentRow = DATA_START_ROW To lastRow
        ' Check if row is empty
        If IsRowEmpty(ws, currentRow) Then
            emptyCount = emptyCount + 1
            ' Clear any previous validation
            ClearRowValidation ws, currentRow
        Else
            ' Validate the row
            If ValidateRow(ws, currentRow) Then
                validCount = validCount + 1
            Else
                errorCount = errorCount + 1
            End If
        End If
        
        ' Update progress every 50 rows
        If currentRow Mod 50 = 0 Then
            UpdateStatus ws, "Validating... Row " & currentRow & " of " & lastRow
            DoEvents
        End If
    Next currentRow
    
    ' Re-enable screen updating
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
    
    ' Show summary
    Dim summary As String
    Dim timeTaken As Double
    timeTaken = Round(Timer - startTime, 2)
    
    summary = "Validation Complete!" & vbCrLf & vbCrLf & _
              "✓ Valid Records: " & validCount & vbCrLf & _
              "✗ Records with Errors: " & errorCount & vbCrLf & _
              "○ Empty Rows: " & emptyCount & vbCrLf & vbCrLf & _
              "Time taken: " & timeTaken & " seconds"
    
    UpdateStatus ws, validCount & " Valid | " & errorCount & " Errors"
    
    MsgBox summary, vbInformation, "Validation Results"
End Sub

' ============================================
' Validate Single Row
' ============================================
Function ValidateRow(ws As Worksheet, rowNum As Long) As Boolean
    Dim errors As String
    Dim cellValue As String
    
    errors = ""
    
    ' 1. Validate Client Name (REQUIRED)
    cellValue = Trim(ws.Cells(rowNum, COL_CLIENT_NAME).Value)
    If cellValue = "" Then
        errors = errors & "Name is required; "
    End If
    
    ' 2. Validate CNIC Format (if provided)
    cellValue = Trim(ws.Cells(rowNum, COL_CNIC).Value)
    If cellValue <> "" Then
        If Not ValidateCNIC(cellValue) Then
            errors = errors & "CNIC format incorrect (use: 12345-6789012-3); "
        End If
    End If
    
    ' 3. Validate NTN Format (if provided)
    cellValue = Trim(ws.Cells(rowNum, COL_NTN).Value)
    If cellValue <> "" Then
        If Not ValidateNTN(cellValue) Then
            errors = errors & "NTN format incorrect (use: 1234567 or 1234567-8); "
        End If
    End If
    
    ' 4. Validate Email Format (if provided)
    cellValue = Trim(ws.Cells(rowNum, COL_EMAIL).Value)
    If cellValue <> "" Then
        If Not ValidateEmail(cellValue) Then
            errors = errors & "Email format incorrect (must have @domain.com); "
        End If
    End If
    
    ' 5. Validate Phone Format (if provided)
    cellValue = Trim(ws.Cells(rowNum, COL_PHONE).Value)
    If cellValue <> "" Then
        If Not ValidatePhone(cellValue) Then
            errors = errors & "Phone format incorrect (must start with +92 or 0); "
        End If
    End If
    
    ' 6. Validate Business Type (if provided)
    cellValue = Trim(ws.Cells(rowNum, COL_BUSINESS_TYPE).Value)
    If cellValue <> "" Then
        If Not ValidateBusinessType(cellValue) Then
            errors = errors & "Business Type must be from dropdown; "
        End If
    End If
    
    ' 7. Validate Status (if provided)
    cellValue = Trim(ws.Cells(rowNum, COL_STATUS).Value)
    If cellValue <> "" Then
        If Not ValidateStatus(cellValue) Then
            errors = errors & "Status must be from dropdown; "
        End If
    End If
    
    ' 8. Validate Tax Year (if provided)
    cellValue = Trim(ws.Cells(rowNum, COL_TAX_YEAR).Value)
    If cellValue <> "" Then
        If Not ValidateTaxYear(cellValue) Then
            errors = errors & "Tax Year must be from dropdown; "
        End If
    End If
    
    ' Apply formatting based on validation result
    If errors = "" Then
        ' Valid row - color green
        ColorRow ws, rowNum, COLOR_GREEN
        ws.Cells(rowNum, COL_VALIDATION_STATUS).Value = "✓ Valid"
        ws.Cells(rowNum, COL_VALIDATION_STATUS).Font.Color = RGB(0, 97, 0) ' Dark green
        ws.Cells(rowNum, COL_VALIDATION_STATUS).Font.Bold = True
        ValidateRow = True
    Else
        ' Invalid row - color red
        ColorRow ws, rowNum, COLOR_RED
        ' Remove trailing semicolon and space
        errors = Left(errors, Len(errors) - 2)
        ws.Cells(rowNum, COL_VALIDATION_STATUS).Value = "✗ " & errors
        ws.Cells(rowNum, COL_VALIDATION_STATUS).Font.Color = RGB(156, 0, 6) ' Dark red
        ws.Cells(rowNum, COL_VALIDATION_STATUS).Font.Bold = True
        ValidateRow = False
    End If
End Function

' ============================================
' Validation Helper Functions
' ============================================

Function ValidateCNIC(cnic As String) As Boolean
    ' CNIC must be exactly 15 characters in format: 12345-6789012-3
    ValidateCNIC = False
    
    If Len(cnic) = 15 Then
        If Mid(cnic, 6, 1) = "-" And Mid(cnic, 14, 1) = "-" Then
            ' Check if other characters are digits
            Dim part1 As String, part2 As String, part3 As String
            part1 = Left(cnic, 5)
            part2 = Mid(cnic, 7, 7)
            part3 = Right(cnic, 1)
            
            If IsNumeric(part1) And IsNumeric(part2) And IsNumeric(part3) Then
                ValidateCNIC = True
            End If
        End If
    End If
End Function

Function ValidateNTN(ntn As String) As Boolean
    ' NTN must be 7 digits or 9 characters (7 digits + dash + 1 digit)
    ValidateNTN = False
    
    If Len(ntn) = 7 Then
        If IsNumeric(ntn) Then ValidateNTN = True
    ElseIf Len(ntn) = 9 Then
        If Mid(ntn, 8, 1) = "-" Then
            If IsNumeric(Left(ntn, 7)) And IsNumeric(Right(ntn, 1)) Then
                ValidateNTN = True
            End If
        End If
    End If
End Function

Function ValidateEmail(email As String) As Boolean
    ' Email must contain @ and at least one dot after @
    ValidateEmail = False
    
    Dim atPos As Long, dotPos As Long
    atPos = InStr(email, "@")
    
    If atPos > 1 Then
        dotPos = InStr(atPos, email, ".")
        If dotPos > atPos + 1 And dotPos < Len(email) Then
            ValidateEmail = True
        End If
    End If
End Function

Function ValidatePhone(phone As String) As Boolean
    ' Phone must start with +92 or 0
    ValidatePhone = False
    
    If Left(phone, 3) = "+92" Or Left(phone, 1) = "0" Then
        ValidatePhone = True
    End If
End Function

Function ValidateBusinessType(businessType As String) As Boolean
    ' Must be one of: Individual, Business, Self-Employed, Partnership, Corporation
    Dim validTypes As Variant
    validTypes = Array("Individual", "Business", "Self-Employed", "Partnership", "Corporation")
    
    ValidateBusinessType = False
    Dim i As Long
    For i = LBound(validTypes) To UBound(validTypes)
        If businessType = validTypes(i) Then
            ValidateBusinessType = True
            Exit Function
        End If
    Next i
End Function

Function ValidateStatus(status As String) As Boolean
    ' Must be one of: Active, Inactive, Pending
    Dim validStatuses As Variant
    validStatuses = Array("Active", "Inactive", "Pending")
    
    ValidateStatus = False
    Dim i As Long
    For i = LBound(validStatuses) To UBound(validStatuses)
        If status = validStatuses(i) Then
            ValidateStatus = True
            Exit Function
        End If
    Next i
End Function

Function ValidateTaxYear(taxYear As String) As Boolean
    ' Must be one of: 2020-2026
    Dim validYears As Variant
    validYears = Array("2020", "2021", "2022", "2023", "2024", "2025", "2026")
    
    ValidateTaxYear = False
    Dim i As Long
    For i = LBound(validYears) To UBound(validYears)
        If taxYear = validYears(i) Then
            ValidateTaxYear = True
            Exit Function
        End If
    Next i
End Function

' ============================================
' Helper Functions
' ============================================

Function IsRowEmpty(ws As Worksheet, rowNum As Long) As Boolean
    ' Check if the client name column is empty
    IsRowEmpty = (Trim(ws.Cells(rowNum, COL_CLIENT_NAME).Value) = "")
End Function

Sub ColorRow(ws As Worksheet, rowNum As Long, color As Long)
    ' Color the entire row
    ws.Rows(rowNum).Interior.color = color
End Sub

Sub ClearRowValidation(ws As Worksheet, rowNum As Long)
    ' Clear row color and validation status
    ws.Rows(rowNum).Interior.color = COLOR_WHITE
    ws.Cells(rowNum, COL_VALIDATION_STATUS).Value = ""
End Sub

Sub UpdateStatus(ws As Worksheet, message As String)
    ' Update status in cell B1 (or wherever you place the status label)
    On Error Resume Next
    ws.Range("B1").Value = message
    On Error GoTo 0
End Sub

' ============================================
' Clear Validation Function
' ============================================
Sub ClearAllValidation()
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim currentRow As Long
    
    ' Disable screen updating
    Application.ScreenUpdating = False
    
    ' Get the Client Data worksheet
    Set ws = ThisWorkbook.Worksheets("Client Data")
    
    ' Find last row with data
    lastRow = ws.Cells(ws.Rows.Count, COL_CLIENT_NAME).End(xlUp).Row
    
    ' Clear all validation from data rows
    For currentRow = DATA_START_ROW To lastRow
        ClearRowValidation ws, currentRow
    Next currentRow
    
    ' Update status
    UpdateStatus ws, "Ready"
    
    ' Re-enable screen updating
    Application.ScreenUpdating = True
    
    MsgBox "Validation cleared successfully!", vbInformation, "Clear Validation"
End Sub
