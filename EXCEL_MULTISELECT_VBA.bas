Attribute VB_Name = "MultiSelectDropdown"
'==============================================================================
' VBA CODE FOR MULTI-SELECT BUSINESS TYPE DROPDOWN
' File: EXCEL_MULTISELECT_VBA.bas
' Purpose: Enable multi-select functionality for BUSINESS TYPE column
' 
' HOW TO ADD THIS TO YOUR EXCEL FILE:
' 1. Open the Excel template file
' 2. Press ALT + F11 to open VBA Editor
' 3. Double-click on the "Client Data" sheet in the left panel
' 4. Copy and paste this code into the code window
' 5. Save the file as .xlsm (Excel Macro-Enabled Workbook)
' 6. Close VBA Editor
'==============================================================================

Private Sub Worksheet_Change(ByVal Target As Range)
    Dim rngDropdown As Range
    Dim oldValue As String
    Dim newValue As String
    Dim delimiter As String
    
    ' Set delimiter for multiple selections
    delimiter = ", "
    
    ' Define the range for BUSINESS TYPE column (L2:L502)
    ' Column L is the BUSINESS TYPE column in the new structure
    Set rngDropdown = Me.Range("L2:L502")
    
    ' Check if the changed cell is in the dropdown range
    If Not Intersect(Target, rngDropdown) Is Nothing Then
        ' Prevent multiple triggers
        Application.EnableEvents = False
        
        ' Get the new value that was just selected
        newValue = Target.Value
        
        ' Undo to get the old value
        Application.Undo
        oldValue = Target.Value
        
        ' Restore the new value
        Target.Value = newValue
        
        ' Handle the multi-select logic
        If oldValue = "" Then
            ' First selection - just use the new value
            Target.Value = newValue
        Else
            ' Check if the new value already exists in the old value
            If InStr(1, oldValue, newValue) = 0 Then
                ' New value doesn't exist - add it
                Target.Value = oldValue & delimiter & newValue
            Else
                ' New value exists - remove it (toggle off)
                ' Handle different positions: beginning, middle, end
                Target.Value = Replace(oldValue, newValue & delimiter, "")
                Target.Value = Replace(Target.Value, delimiter & newValue, "")
                
                ' If it's the only value, clear the cell
                If Target.Value = newValue Then
                    Target.Value = ""
                End If
            End If
        End If
        
        ' Re-enable events
        Application.EnableEvents = True
    End If
End Sub

'==============================================================================
' ALTERNATIVE: Right-Click Context Menu Method
' This provides a more user-friendly interface
'==============================================================================

Private Sub Worksheet_BeforeRightClick(ByVal Target As Range, Cancel As Boolean)
    Dim rngDropdown As Range
    Dim arrOptions() As String
    Dim i As Integer
    Dim selectedOptions As String
    Dim optionsList As String
    
    ' Define the range for BUSINESS TYPE column
    Set rngDropdown = Me.Range("L2:L502")
    
    ' Check if right-click is in the dropdown range
    If Not Intersect(Target, rngDropdown) Is Nothing Then
        Cancel = True ' Prevent default context menu
        
        ' Define available options
        arrOptions = Split("Business,Salary,Other Source,Property,Foreign Source,Capital Gain", ",")
        
        ' Get currently selected options
        selectedOptions = Target.Value
        
        ' Build options list with checkmarks
        optionsList = "Select Business Types (click to toggle):" & vbCrLf & vbCrLf
        For i = LBound(arrOptions) To UBound(arrOptions)
            If InStr(1, selectedOptions, arrOptions(i)) > 0 Then
                optionsList = optionsList & "☑ " & arrOptions(i) & vbCrLf
            Else
                optionsList = optionsList & "☐ " & arrOptions(i) & vbCrLf
            End If
        Next i
        
        optionsList = optionsList & vbCrLf & "Current: " & selectedOptions
        
        ' Show message (in production, this would be a custom form)
        MsgBox optionsList, vbInformation, "Multi-Select Business Type"
    End If
End Sub

'==============================================================================
' HELPER FUNCTION: Validate Business Type Format
'==============================================================================

Function ValidateBusinessType(cellValue As String) As Boolean
    Dim validOptions As String
    Dim arrOptions() As String
    Dim arrSelected() As String
    Dim i As Integer
    Dim isValid As Boolean
    
    ' Define valid options
    validOptions = "Business,Salary,Other Source,Property,Foreign Source,Capital Gain"
    arrOptions = Split(validOptions, ",")
    
    ' If empty, it's valid (optional field)
    If cellValue = "" Then
        ValidateBusinessType = True
        Exit Function
    End If
    
    ' Split selected values
    arrSelected = Split(cellValue, ", ")
    
    ' Check each selected value
    isValid = True
    For i = LBound(arrSelected) To UBound(arrSelected)
        If InStr(1, validOptions, Trim(arrSelected(i))) = 0 Then
            isValid = False
            Exit For
        End If
    Next i
    
    ValidateBusinessType = isValid
End Function

'==============================================================================
' INSTALLATION INSTRUCTIONS
'==============================================================================
'
' STEP 1: Enable Developer Tab in Excel
' - File > Options > Customize Ribbon
' - Check "Developer" in the right panel
' - Click OK
'
' STEP 2: Open VBA Editor
' - Click Developer tab
' - Click "Visual Basic" button
' - Or press ALT + F11
'
' STEP 3: Add Code to Sheet
' - In the left panel (Project Explorer), find your workbook
' - Expand "Microsoft Excel Objects"
' - Double-click on "Client Data" sheet
' - Copy and paste this entire code
'
' STEP 4: Save as Macro-Enabled
' - File > Save As
' - Choose "Excel Macro-Enabled Workbook (*.xlsm)"
' - Save the file
'
' STEP 5: Enable Macros
' - When opening the file, click "Enable Content" if prompted
' - Go to File > Options > Trust Center > Trust Center Settings
' - Click "Macro Settings"
' - Select "Enable all macros" (or "Disable with notification")
'
' STEP 6: Test the Functionality
' - Go to Client Data sheet
' - Click on any cell in column L (BUSINESS TYPE)
' - Select an option from dropdown
' - Select another option - it should append with comma
' - Select same option again - it should remove it (toggle)
'
'==============================================================================
' TROUBLESHOOTING
'==============================================================================
'
' Problem: Code doesn't run
' Solution: Make sure macros are enabled and file is saved as .xlsm
'
' Problem: Multiple selections don't work
' Solution: Check that the range "L2:L502" matches your BUSINESS TYPE column
'
' Problem: Error when selecting
' Solution: Make sure Application.EnableEvents is set back to True
'
' Problem: Dropdown doesn't show options
' Solution: The dropdown validation must be set in the Excel sheet itself
'           This VBA code only handles the multi-select behavior
'
'==============================================================================
' NOTES FOR DEVELOPERS
'==============================================================================
'
' - This code uses the Worksheet_Change event to intercept dropdown selections
' - It uses Application.Undo to retrieve the previous value
' - The delimiter ", " (comma-space) is used to separate multiple selections
' - The code includes toggle functionality (select again to deselect)
' - For production use, consider adding error handling and logging
' - The range L2:L502 allows for 500 client records
' - Adjust the range if you need more or fewer rows
'
'==============================================================================
