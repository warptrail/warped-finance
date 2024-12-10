// Splitting Endpoint
/* Route:

POST /api/transaction/:id/split

*/

// Example Request
const exampleRequest = {
  splits: [
    { amount: -7.0, category: 'groceries', tags: ['snacks'] },
    { amount: -3.0, category: 'junk food', tags: ['soda'] },
  ],
};
