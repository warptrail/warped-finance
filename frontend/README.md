# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

The changes allow the page size to dynamically update by coordinating local state (`pageSize`) with React Table's `setPageSize` function. Here's how the mechanism works:

1. **Local State for `pageSize`**:

   - The `pageSize` state is managed with `useState`.
   - This keeps track of the user-selected page size from the dropdown menu.

2. **React Table's `setPageSize`**:

   - This is a method provided by React Table to update the number of rows displayed per page dynamically.
   - It updates React Table's internal pagination logic to reflect the new page size.

3. **Dropdown and Change Handler**:

   - The `<select>` element provides options (e.g., 5, 10, 20, 50) for page sizes.
   - When the user selects a new page size, the `onChange` handler `handlePageSizeChange` is triggered.

4. **`handlePageSizeChange`**:
   - This function updates both the local state (`pageSize`) and React Table's page size via `setPageSize`.
   - It synchronizes the dropdown menu value with React Table's internal pagination mechanism.

Here is a simplified breakdown:

- **Dropdown**: Captures user input for the desired page size.
- **State Update**: Updates `pageSize` in React state for UI consistency.
- **React Table Update**: Calls `setPageSize` to inform React Table about the new page size.

This coordination ensures that React Table's pagination and the dropdown menu stay in sync, providing a seamless user experience for adjusting the number of rows displayed per page.
