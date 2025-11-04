# Toast Notification System

This directory contains utilities for consistent toast notifications across the BookBharat Admin UI.

## Files

### `toast.ts`
Common toast utility with consistent styling and behavior.

### `globalAlert.ts`
Utility to replace native `alert()` calls with toast notifications.

## Usage

### Basic Toast Usage

```typescript
import { showToast } from '../utils/toast';

// Success message
showToast.success('Operation completed successfully!');

// Error message
showToast.error('Something went wrong. Please try again.');

// Info message
showToast.info('Please review your changes.');

// Warning message
showToast.warning('This action cannot be undone.');

// Loading state
const loadingId = showToast.loading('Processing...');

// Dismiss specific toast
showToast.dismissToast(loadingId);

// Dismiss all toasts
showToast.dismiss();
```

### Replacing Native Alerts

```typescript
import { showAlert } from '../utils/globalAlert';

// Instead of: alert('Error message')
showAlert.error('Error message');

// Instead of alert() for success
showAlert.success('Success message');
```

### In React Components

```typescript
import React from 'react';
import { showToast } from '../utils/toast';

const MyComponent = () => {
  const handleSave = async () => {
    try {
      await saveData();
      showToast.success('Data saved successfully!');
    } catch (error) {
      showToast.error('Failed to save data: ' + error.message);
    }
  };

  return <button onClick={handleSave}>Save</button>;
};
```

### In React Query Mutations

```typescript
import { useMutation } from '@tanstack/react-query';
import { showToast } from '../utils/toast';

const mutation = useMutation({
  mutationFn: updateData,
  onSuccess: () => {
    showToast.success('Data updated successfully!');
  },
  onError: (error) => {
    showToast.error('Update failed: ' + error.message);
  }
});
```

## Configuration

All toasts use these default settings:
- **Position**: Top-right
- **Duration**:
  - Success/Info: 4 seconds
  - Warning: 5 seconds
  - Error: 6 seconds
- **Styling**: Consistent with admin UI theme

## Global Alert Override (Production Only)

In production mode, native `alert()` calls are automatically converted to toast notifications. This ensures a consistent user experience across the entire admin interface.

## Best Practices

1. **Use descriptive messages**: Be clear about what happened
2. **Choose appropriate toast types**:
   - Success: Completed operations
   - Error: Failed operations
   - Warning: Actions requiring attention
   - Info: Helpful information
3. **Keep messages concise**: Toasts are meant for brief notifications
4. **Use loading states** for async operations
5. **Don't overuse**: Too many toasts can be overwhelming

## Examples

```typescript
// Good
showToast.success('Product created successfully!');
showToast.error('Failed to upload image. Please check file size.');
showToast.warning('This will delete all associated data.');
showToast.info('Changes will be saved automatically.');

// Avoid
showToast.error('Error occurred while trying to process your request to update the product details in the database due to a validation error in the input fields that you provided which are not in the correct format as expected by the system validation rules.');
```