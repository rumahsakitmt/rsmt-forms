# RSUD Forms

RSUD Forms manages reusable clinical form definitions and the records staff create from them.

## Language

**Form**:
The lasting identity of a hospital questionnaire, independent of later wording or requirement changes.
_Avoid_: Template, questionnaire type

**Form Version**:
An immutable, published definition of a Form at a specific point in time.
_Avoid_: Revision, current form

**Submission**:
A patient-specific record created from exactly one Form Version. It is editable while a Draft and immutable once Submitted.
_Avoid_: Response, filled form

**Draft**:
An incomplete Submission that may be changed only by its author or an Administrator.
_Avoid_: Work in progress

**Patient Context**:
The patient name, medical-record number, and room captured as a historical snapshot on a Submission.
_Avoid_: Patient record, encounter

**Staff**:
An authenticated hospital worker who can create Submissions and view Submitted records.
_Avoid_: User, member

**Administrator**:
A Staff member who can provision accounts and manage every Draft.
_Avoid_: Superuser
