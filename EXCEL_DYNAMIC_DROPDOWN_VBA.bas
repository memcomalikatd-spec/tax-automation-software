Private Sub Worksheet_Change(ByVal Target As Range)
    '=========================================================================
    ' DYNAMIC DROPDOWN LOGIC FOR CLIENT IMPORT TEMPLATE
    '=========================================================================
    ' Column L (12) = PERSON: Company, AOP, Individual
    ' Column M (13) = SOURCE OF INCOME: Dynamic based on Column L selection
    '
    ' LOGIC:
    ' - If L = "Company" → M auto-fills "Company" (no dropdown)
    ' - If L = "AOP" → M shows dropdown: AOP, Distributor AOP
    ' - If L = "Individual" → M shows multi-select dropdown with 10 options
    '=========================================================================
    
    Dim personCell As Range
    Dim sourceCell As Range
    Dim personValue As String
    Dim currentValue As String
    Dim newValue As String
    Dim delimiter As String
    
    delimiter = ", "
    
    ' Disable events to prevent recursive calls
    On Error GoTo ErrorHandler
    Application.EnableEvents = False
    
    ' Check if change is in Column L (PERSON) - rows 2 to 502
    If Not Intersect(Target, Range("L2:L502")) Is Nothing Then
        For Each personCell In Intersect(Target, Range("L2:L502"))
            Set sourceCell = personCell.Offset(0, 1) ' Column M (one column to the right)
            personValue = Trim(personCell.Value)
            
            ' Clear any existing validation
            sourceCell.Validation.Delete
            
            ' Apply logic based on PERSON selection
            Select Case personValue
                Case "Company"
                    ' Auto-fill "Company" in Column M
                    sourceCell.Value = "Company"
                    sourceCell.Interior.Color = RGB(198, 239, 206) ' Light green
                    sourceCell.Font.Color = RGB(0, 97, 0) ' Dark green
                    ' No dropdown needed
                    
                Case "AOP"
                    ' Clear the cell and add dropdown with AOP options
                    sourceCell.Value = ""
                    sourceCell.Interior.ColorIndex = xlNone
                    sourceCell.Font.ColorIndex = xlAutomatic
                    
                    With sourceCell.Validation
                        .Delete
                        .Add Type:=xlValidateList, _
                             AlertStyle:=xlValidAlertStop, _
                             Operator:=xlBetween, _
                             Formula1:="AOP,Distributor AOP"
                        .IgnoreBlank = True
                        .InCellDropdown = True
                        .InputTitle = "AOP Type"
                        .ErrorTitle = "Invalid Selection"
                        .InputMessage = "Select: AOP or Distributor AOP"
                        .ErrorMessage = "Please select either 'AOP' or 'Distributor AOP' from the dropdown."
                        .ShowInput = True
                        .ShowError = True
                    End With
                    
                Case "Individual"
                    ' Clear the cell and add multi-select dropdown
                    sourceCell.Value = ""
                    sourceCell.Interior.ColorIndex = xlNone
                    sourceCell.Font.ColorIndex = xlAutomatic
                    
                    With sourceCell.Validation
                        .Delete
                        .Add Type:=xlValidateList, _
                             AlertStyle:=xlValidAlertWarning, _
                             Operator:=xlBetween, _
                             Formula1:="Business,Salary,Property,Other Source,Foreign Source,Capital Gain,Agriculture,Freelancer,Commission,Partnership"
                        .IgnoreBlank = True
                        .InCellDropdown = True
                        .InputTitle = "Income Sources (Multi-Select)"
                        .ErrorTitle = "Multiple Selections Allowed"
                        .InputMessage = "Click dropdown to select. Multiple selections will be comma-separated. Select one at a time."
                        .ErrorMessage = "You can select multiple income sources. They will be combined with commas."
                        .ShowInput = True
                        .ShowError = True
                    End With
                    
                Case Else
                    ' If PERSON is empty or invalid, clear SOURCE OF INCOME
                    sourceCell.Value = ""
                    sourceCell.Validation.Delete
                    sourceCell.Interior.ColorIndex = xlNone
                    sourceCell.Font.ColorIndex = xlAutomatic
            End Select
        Next personCell
    End If
    
    ' Handle multi-select for Column M when PERSON = "Individual"
    If Not Intersect(Target, Range("M2:M502")) Is Nothing Then
        For Each sourceCell In Intersect(Target, Range("M2:M502"))
            ' Check if the corresponding PERSON cell (Column L) is "Individual"
            Set personCell = sourceCell.Offset(0, -1) ' Column L (one column to the left)
            
            If Trim(personCell.Value) = "Individual" Then
                ' Multi-select logic
                currentValue = Trim(sourceCell.Value)
                newValue = Trim(Target.Value)
                
                ' If cell is not empty and new value is being added
                If currentValue <> "" And newValue <> "" Then
                    ' Check if the new value already exists in the list
                    If InStr(1, currentValue, newValue, vbTextCompare) = 0 Then
                        ' Add new value with comma separator
                        sourceCell.Value = currentValue & delimiter & newValue
                    End If
                ElseIf newValue <> "" Then
                    ' First selection
                    sourceCell.Value = newValue
                End If
            End If
        Next sourceCell
    End If
    
    ' Re-enable events
    Application.EnableEvents = True
    Exit Sub
    
ErrorHandler:
    Application.EnableEvents = True
    MsgBox "An error occurred: " & Err.Description, vbExclamation, "Error"
End Sub


'=========================================================================
' HELPER FUNCTION: Remove duplicate values from comma-separated list
'=========================================================================
Private Function RemoveDuplicates(ByVal inputString As String, delimiter As String) As String
    Dim items() As String
    Dim uniqueItems As Object
    Dim item As Variant
    Dim result As String
    
    Set uniqueItems = CreateObject("Scripting.Dictionary")
    
    ' Split the string
    items = Split(inputString, delimiter)
    
    ' Add unique items to dictionary
    For Each item In items
        item = Trim(item)
        If item <> "" And Not uniqueItems.Exists(item) Then
            uniqueItems.Add item, Nothing
        End If
    Next item
    
    ' Rebuild string
    result = ""
    For Each item In uniqueItems.Keys
        If result = "" Then
            result = item
        Else
            result = result & delimiter & item
        End If
    Next item
    
    RemoveDuplicates = result
End Function


'=========================================================================
' INSTALLATION INSTRUCTIONS
'=========================================================================
' 1. Open the Excel file
' 2. Press ALT + F11 to open VBA Editor
' 3. In the Project Explorer (left panel), find your workbook
' 4. Double-click on "Sheet2 (Client Data)" or the sheet named "Client Data"
' 5. Copy ALL the code above (from Private Sub to End Sub including helper function)
' 6. Paste it into the code window
' 7. Close VBA Editor (click X or press ALT + Q)
' 8. Save the file as .xlsm (Excel Macro-Enabled Workbook)
' 9. When opening the file, click "Enable Content" to allow macros
'
' TESTING:
' 1. Go to "Client Data" sheet
' 2. In any row, select "Company" in Column L → Column M should auto-fill "Company"
' 3. Select "AOP" in Column L → Column M should show dropdown with 2 options
' 4. Select "Individual" in Column L → Column M should show dropdown with 10 options
' 5. For Individual, select multiple items one by one - they will combine with commas
'=========================================================================
