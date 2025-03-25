Sure, let's document each endpoint provided by the `medicineController.js` file.

### 1. Create a New Medicine

- **Endpoint**: `POST /medicines`
- **Description**: Creates a new medicine with the provided details.
- **Request Body**:
  - `name`: Name of the medicine (String)
  - `category`: Category of the medicine (String)
  - `quantity`: Quantity of the medicine in stock (Number)
  - `price`: Price of the medicine (Number)
  - `supplier`: Supplier details of the medicine (String)
  - `expiryDate`: Expiry date of the medicine (Date)
- **Response**:
  - `message`: Success message
  - `medicine`: Details of the newly created medicine

### 2. Get All Medicines

- **Endpoint**: `GET /medicines`
- **Description**: Retrieves a list of all medicines.
- **Response**:
  - `medicines`: Array containing details of all medicines

### 3. Get Medicine by ID

- **Endpoint**: `GET /medicines/:id`
- **Description**: Retrieves details of a specific medicine by its ID.
- **Request Parameters**:
  - `id`: ID of the medicine (String)
- **Response**:
  - `medicine`: Details of the medicine with the specified ID

### 4. Update Medicine by ID

- **Endpoint**: `PUT /medicines/:id`
- **Description**: Updates details of a specific medicine by its ID.
- **Request Parameters**:
  - `id`: ID of the medicine (String)
- **Request Body**:
  - Same as the request body for creating a medicine
- **Response**:
  - `message`: Success message
  - `medicine`: Updated details of the medicine

### 5. Delete Medicine by ID

- **Endpoint**: `DELETE /medicines/:id`
- **Description**: Deletes a specific medicine by its ID.
- **Request Parameters**:
  - `id`: ID of the medicine (String)
- **Response**:
  - `message`: Success message
  - `medicine`: Details of the deleted medicine

### 6. Search Medicines

- **Endpoint**: `GET /medicines/search`
- **Description**: Searches for medicines based on a search term.
- **Query Parameters**:
  - `searchTerm`: Term to search for in medicine names, categories, or suppliers (String)
- **Response**:
  - `medicines`: Array containing details of matching medicines

### 7. Filter Medicines

- **Endpoint**: `GET /medicines/filter`
- **Description**: Filters medicines based on price and quantity ranges.
- **Query Parameters**:
  - `minPrice`: Minimum price of medicines (Number)
  - `maxPrice`: Maximum price of medicines (Number)
  - `minQuantity`: Minimum quantity of medicines (Number)
  - `maxQuantity`: Maximum quantity of medicines (Number)
- **Response**:
  - `medicines`: Array containing details of filtered medicines

### 8. Receive Notifications for Low Stock

- **Endpoint**: `GET /medicines/low-stock`
- **Description**: Retrieves medicines with low stock (quantity below a threshold).
- **Response**:
  - `message`: Message indicating presence or absence of low stock medicines
  - `lowStockMedicines`: Array containing details of low stock medicines

### 9. Sort Medicines

- **Endpoint**: `GET /medicines/sort`
- **Description**: Sorts medicines based on specified criteria.
- **Query Parameters**:
  - `sortBy`: Field to sort by (e.g., `name`, `price`, `expiryDate`)
  - `order`: Sorting order (`asc` for ascending, `desc` for descending)
- **Response**:
  - `medicines`: Array containing sorted medicines

### 10. Update Medicine Quantity

- **Endpoint**: `PUT /medicines/:id/update-quantity`
- **Description**: Updates the quantity of a specific medicine by its ID.
- **Request Parameters**:
  - `id`: ID of the medicine (String)
- **Request Body**:
  - `quantity`: New quantity of the medicine (Number)
- **Response**:
  - `message`: Success message
  - `updatedMedicine`: Updated details of the medicine

### 11. Expiration Alerts

- **Endpoint**: `GET /medicines/expiration-alerts`
- **Description**: Retrieves medicines nearing their expiry date.
- **Response**:
  - `message`: Message indicating presence or absence of medicines nearing expiry
  - `expirationAlertMedicines`: Array containing details of medicines nearing expiry

These are the documented endpoints for managing medicines in your application. If you need further clarification on any endpoint or additional information, feel free to ask!