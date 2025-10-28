# Settings Components (modularization helpers)

This folder contains small, focused components to help reduce duplication in `app/dashboard/settings/page.tsx`.

Files added
- `SaveButton.tsx` - a small wrapper around the existing `Button` + `Save` icon. Accepts `loading` and all native button props.
- `LabeledField.tsx` - provides a consistent label + hint container around inputs.
- `ToggleButton.tsx` - simple toggle-styled button that wraps `Button` with variant switching.

Why these exist
- The Settings page contains many repeated patterns: labeled inputs, save buttons, and toggle controls. These components are intentionally minimal so they can be dropped in without changing behavior.

How to use

1) Save buttons
Replace repeated blocks like:

  <div className="flex justify-end">
    <Button onClick={handleProfileSave} disabled={loading}>
      <Save className="w-4 h-4 mr-2" />
      {loading ? 'Saving...' : 'Save Profile'}
    </Button>
  </div>

With:

  <div className="flex justify-end">
    <SaveButton onClick={handleProfileSave} disabled={loading} loading={loading}>
      Save Profile
    </SaveButton>
  </div>

2) Labeled fields
Instead of repeating a label tag and hint markup, wrap the input with `LabeledField`:

  <LabeledField label="Display Name" id="displayName">
    <Input id="displayName" value={...} onChange={...} />
  </LabeledField>

3) Toggle buttons
Replace inline toggles with `ToggleButton`:

  <ToggleButton
    enabled={invoiceAppearanceData.alwaysCcSelf}
    onToggle={() => setInvoiceAppearanceData(prev => ({ ...prev, alwaysCcSelf: !prev.alwaysCcSelf }))}
  />

Migration plan
- Start by replacing visually identical repeated Save buttons using `SaveButton`.
- Next, convert label+input groups to `LabeledField` where appropriate.
- Optionally replace repeated toggle/button pairs with `ToggleButton`.

Notes
- These components intentionally don't change styling or behavior. They call into the existing `Button` and input components used across the repo.
- If you want, I can run an automated patch to replace all Save button instances in `app/dashboard/settings/page.tsx` for you and run a local type check/build to validate.
