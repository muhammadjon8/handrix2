## ADDED Requirements

### Requirement: Compute itemized price estimate on job creation
The pricing engine SHALL compute an itemized quote comprising `laborCost`, `materialCost`, and `transportCost` when `POST /jobs` is called. The total MUST equal the sum of the three components. All values are in USD for MVP.

#### Scenario: Labor cost from job category base price
- **WHEN** a job is created with a valid `categoryId`
- **THEN** `laborCost` is set to `JobCategory.basePrice` for that category

#### Scenario: Material cost from Materials service stub
- **WHEN** a job is created and the Materials vendor is not yet integrated
- **THEN** `materialCost` returns a flat estimate from the `MaterialsService` stub (configurable, defaulting to a non-zero value so the breakdown is plausible)

#### Scenario: Transport cost from proximity to nearest available handyman
- **WHEN** a job is created with a valid location
- **THEN** `transportCost` is computed based on the distance from the nearest available handyman to the job location using the `MapsService`; if no handyman location is available, a flat default is used

#### Scenario: Total equals sum of components
- **WHEN** a price estimate is returned
- **THEN** `priceEstimate.total == laborCost + materialCost + transportCost`

### Requirement: Price estimate stored on job record
The pricing engine SHALL persist the itemized breakdown (`laborCost`, `materialCost`, `transportCost`, `quotedPrice`) on the `Job` record at creation time.

#### Scenario: Fields persisted
- **WHEN** a job is successfully created
- **THEN** `Job.laborCost`, `Job.materialCost`, `Job.transportCost`, and `Job.quotedPrice` are all set and retrievable via `GET /jobs/:id`

### Requirement: External service interfaces are swappable
The pricing engine SHALL use `MaterialsService` and `MapsService` interfaces. The live implementations SHALL be injected via dependency injection; stubs SHALL be the default when vendor credentials are absent.

#### Scenario: Stub used when vendor not configured
- **WHEN** `MATERIALS_API_KEY` environment variable is absent
- **THEN** `MaterialsService` stub is injected and returns a configured default cost without making external HTTP calls

#### Scenario: Live implementation used when vendor configured
- **WHEN** `MATERIALS_API_KEY` environment variable is present
- **THEN** the live `MaterialsService` implementation is injected and calls the vendor API for real cost data
