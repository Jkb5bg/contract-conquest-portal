# URGENT: Backend Database Migration Required

## Error
```
psycopg2.errors.UndefinedColumn: column matches.status does not exist
```

## Issue
The backend code is trying to query `matches.status` and `matches.status_updated_at` columns that don't exist in the `matches` table.

## Required Migration

You need to add these columns to the `matches` table in your backend database:

### SQL Migration (PostgreSQL)
```sql
-- Add status column to matches table
ALTER TABLE matches
ADD COLUMN status VARCHAR(20) DEFAULT 'new' NOT NULL;

-- Add status_updated_at column
ALTER TABLE matches
ADD COLUMN status_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for faster status filtering
CREATE INDEX idx_matches_status ON matches(status);

-- Update existing rows to have 'new' status
UPDATE matches SET status = 'new' WHERE status IS NULL;
```

### Valid Status Values
Based on the frontend code, these are the valid status values:
- `new` - Default for new matches
- `saved` - User has saved for later
- `pursuing` - User is actively pursuing
- `applied` - User has applied
- `passed` - User has passed on this opportunity
- `won` - User won the contract
- `lost` - User lost the contract

### Backend API Changes Needed

The `/opportunities/mine` endpoint needs to:

1. **Accept status filter parameter**
   - Query param: `status` (optional)
   - Example: `?status=pursuing`

2. **Accept search parameter** (for filtering across ALL opportunities)
   - Query param: `search` (optional)
   - Should search in: `opportunity_title` and `agency` fields
   - Example: `?search=construction`

3. **Accept location filter** (for filtering across ALL opportunities)
   - Query param: `state` (optional)
   - Should filter by: `place_of_performance.state`
   - Example: `?state=VA`

### Example Backend Code (Python/SQLAlchemy)
```python
@router.get("/opportunities/mine")
async def get_my_opportunities(
    status: Optional[str] = None,
    search: Optional[str] = None,
    state: Optional[str] = None,
    score_min: float = 0.0,
    score_max: float = 1.0,
    limit: int = 10,
    offset: int = 0,
    sort_by: str = "match_score",
    sort_order: str = "desc",
    current_user = Depends(get_current_user)
):
    query = db.query(Match).filter(Match.client_id == current_user.id)

    # Apply filters
    query = query.filter(Match.match_score >= score_min)
    query = query.filter(Match.match_score <= score_max)

    if status:
        query = query.filter(Match.status == status)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Match.opportunity_title.ilike(search_term),
                Match.agency.ilike(search_term)
            )
        )

    if state:
        # Assuming place_of_performance is JSONB
        query = query.filter(Match.place_of_performance['state'].astext == state)

    # Get total count before pagination
    total = query.count()

    # Apply sorting
    if sort_by == "match_score":
        order_col = Match.match_score
    elif sort_by == "matched_at":
        order_col = Match.matched_at
    else:
        order_col = Match.match_score

    if sort_order == "desc":
        query = query.order_by(order_col.desc())
    else:
        query = query.order_by(order_col.asc())

    # Apply pagination
    opportunities = query.limit(limit).offset(offset).all()

    return {
        "opportunities": opportunities,
        "total": total,
        "limit": limit,
        "offset": offset
    }
```

## Run the Migration

After creating the migration file in your backend:
```bash
# If using Alembic
alembic revision --autogenerate -m "Add status columns to matches table"
alembic upgrade head

# Or run the SQL directly
psql -d your_database -f migration.sql
```

## Test After Migration

1. Restart your backend server
2. Test the opportunities page loads
3. Test status filtering works
4. Test search works across all opportunities
5. Test location filtering works across all opportunities
