# Deployment Scenario Solutions

## Problem Statement

**Current Situation:**
- ✅ Communication uses **service tokens** (company-scoped)
- ✅ PM Tool stores tokens per-company in database
- ✅ Mobile App validates tokens and returns company ID

**Deployment Challenge:**
1. **Mobile App** goes to production FIRST
   - Companies self-register
   - Users register under companies
   - Multiple companies already exist

2. **PM Tool** deploys LATER
   - Initially for internal use only
   - Later becomes a product
   - Needs to connect to existing companies

**Key Questions:**
- How does PM Tool discover which companies exist?
- How does PM Tool get configured per company?
- Who creates the service tokens for each company?
- How to handle the chicken-and-egg problem?

---

## Solution Ideas

### Solution 1: Company Discovery + Token Self-Service (Recommended)

**Concept:** PM Tool can discover companies from Mobile App, and each company can create their own service token.

#### Architecture:

1. **PM Tool Company Discovery**
   - Add endpoint in Mobile App: `GET /api/companies` (public or with admin token)
   - PM Tool can sync companies: `GET /api/companies` → Store in PM Tool DB
   - PM Tool shows list of available companies

2. **Company Self-Service Token Creation**
   - Companies log into Mobile App Admin UI
   - Navigate to Settings → Service Tokens
   - Create a token specifically for "PM Tool"
   - Copy token

3. **PM Tool Configuration Flow**
   - Admin logs into PM Tool
   - Selects company from discovered list (or creates manually)
   - Pastes service token in Settings → Form API Configuration
   - PM Tool can now communicate with Mobile App for that company

#### Pros:
- ✅ Self-service for companies
- ✅ No manual intervention needed
- ✅ Scalable for many companies
- ✅ Companies control their own tokens

#### Cons:
- ❌ Requires company admins to be trained
- ❌ Token must be copied manually (error-prone)

---

### Solution 2: Bootstrap Token for PM Tool

**Concept:** Create a special "PM Tool" service token in Mobile App that can access all companies, used only for initial setup.

#### Architecture:

1. **Global PM Tool Token**
   - Create a special service token in Mobile App with "super admin" privileges
   - This token can:
     - List all companies
     - Create service tokens on behalf of companies
     - Access any company's data

2. **PM Tool Bootstrap Flow**
   - PM Tool uses bootstrap token to:
     - Discover all companies: `GET /api/companies`
     - For each company, create a company-specific token via Mobile App API
     - Store company-specific tokens in PM Tool DB
   - After bootstrap, revoke or restrict bootstrap token

3. **Ongoing Management**
   - Companies can still create their own tokens
   - PM Tool uses per-company tokens for normal operations

#### Pros:
- ✅ Automated onboarding
- ✅ Can migrate existing companies automatically
- ✅ Less manual work

#### Cons:
- ❌ Requires special privileges in Mobile App
- ❌ Security risk if bootstrap token is leaked
- ❌ Complex to implement

---

### Solution 3: Company Registration in PM Tool

**Concept:** Companies register in PM Tool separately, providing their Mobile App company ID and credentials.

#### Architecture:

1. **Company Registration in PM Tool**
   - Add "Company Registration" page in PM Tool
   - Company admin provides:
     - Mobile App company ID (UUID)
     - Service token from Mobile App
   - PM Tool validates token and links company

2. **Service Token Creation**
   - Company admin logs into Mobile App
   - Creates service token for PM Tool
   - Provides token to PM Tool during registration

3. **Validation**
   - PM Tool tests token against Mobile App API
   - Validates company ID matches
   - Stores configuration

#### Pros:
- ✅ Clear separation of concerns
- ✅ Companies explicitly opt-in
- ✅ Simple to implement

#### Cons:
- ❌ Manual registration process
- ❌ Requires company admins to know their company ID

---

### Solution 4: OAuth-Style Company Linking

**Concept:** Similar to OAuth flow, companies authorize PM Tool to access their data.

#### Architecture:

1. **OAuth-Like Flow**
   - Company admin clicks "Connect PM Tool" in Mobile App
   - Mobile App generates authorization code
   - Admin pastes code in PM Tool
   - PM Tool exchanges code for service token via Mobile App API

2. **Service Token Exchange**
   - Mobile App validates authorization code
   - Creates service token for that company
   - Returns token to PM Tool
   - PM Tool stores token

#### Pros:
- ✅ Secure handshake
- ✅ No manual token copying
- ✅ Professional UX

#### Cons:
- ❌ More complex to implement
- ❌ Requires new API endpoints in Mobile App

---

### Solution 5: Shared Database Approach (Not Recommended)

**Concept:** PM Tool reads company data directly from Mobile App database.

#### Architecture:

1. **Shared Database Access**
   - PM Tool has read-only access to Mobile App database
   - Queries companies directly
   - No API communication needed

#### Pros:
- ✅ No API setup needed
- ✅ Fast queries

#### Cons:
- ❌ Tight coupling
- ❌ Security risk
- ❌ Hard to scale
- ❌ Not suitable for product

---

## Recommended Solution: Hybrid Approach

**Combine Solution 1 + Solution 3:**

### Phase 1: Internal Use (Initial Deployment)

1. **Manual Company Setup**
   - Internal team manually adds companies to PM Tool
   - Company admin provides service token
   - Stored in PM Tool database per company

2. **Company Discovery API** (Optional)
   - Add `GET /api/companies` endpoint in Mobile App (admin only)
   - PM Tool can query to verify company IDs

### Phase 2: Product Launch

1. **Self-Service Company Onboarding**
   - Add company registration page in PM Tool
   - Company admin enters:
     - Company name (for display)
     - Service token from Mobile App
   - PM Tool validates token and extracts company ID from Mobile App response

2. **Token Validation & Auto-Discovery**
   - When token is provided, PM Tool:
     - Validates token with Mobile App
     - Extracts company ID from validation response
     - Auto-discovers company name from Mobile App API
     - Links everything together

3. **Company Management UI**
   - List all companies in PM Tool
   - Show connection status
   - Allow reconfiguration of tokens

---

## Implementation Details for Recommended Solution

### Mobile App Changes Needed:

1. **Company Info Endpoint** (Optional but helpful)
   ```java
   GET /api/companies/{id}
   Returns: { id, name, createdAt, ... }
   ```

2. **Service Token Validation Enhancement** (Already exists)
   - Current: Returns company ID
   - Enhancement: Also return company name in validation response

### PM Tool Changes Needed:

1. **Company Entity** (if not exists)
   ```sql
   CREATE TABLE company (
     id UUID PRIMARY KEY,
     mobile_app_company_id UUID NOT NULL UNIQUE,
     name VARCHAR(255),
     service_token_encrypted VARCHAR(512),
     form_api_base_url VARCHAR(512),
     created_at TIMESTAMPTZ,
     updated_at TIMESTAMPTZ
   );
   ```

2. **Company Management UI**
   - List companies
   - Add new company (with token)
   - Edit company configuration
   - Test connection

3. **Token Validation on Save**
   - When token is saved, immediately test it
   - Extract company ID from Mobile App response
   - Auto-populate company information

---

## Migration Path

### For Existing Companies (When PM Tool Launches):

**Option A: Bulk Import Script**
- Write script that reads companies from Mobile App
- Creates entries in PM Tool
- Requires companies to provide tokens manually

**Option B: Company Self-Registration**
- Send email to all company admins
- Provide instructions to create token
- Register in PM Tool

**Option C: Gradual Rollout**
- Start with internal company
- Invite select companies
- Expand gradually

---

## Security Considerations

1. **Token Storage**: ✅ Already encrypted at rest
2. **Token Validation**: ✅ Always validate tokens before storing
3. **Company Isolation**: ✅ Service tokens are company-scoped
4. **Access Control**: ✅ PM Tool admin-only for configuration
5. **Token Expiration**: ✅ Mobile App supports token expiration

---

## Next Steps

1. **Decide on approach** (Recommend: Hybrid Solution 1+3)
2. **Design Company Entity** in PM Tool (if needed)
3. **Implement token validation on save**
4. **Add company management UI**
5. **Create migration plan for existing companies**

---

## Questions to Answer

1. **Will PM Tool have its own company concept, or just mirror Mobile App?**
   - If mirror: Use `mobile_app_company_id` as primary key
   - If separate: Need mapping table

2. **Who creates service tokens?**
   - Company admins (self-service) ✅ Recommended
   - PM Tool admins (centralized) ⚠️ Less scalable
   - Automated (requires special permissions) ⚠️ Complex

3. **How to handle company name changes?**
   - Sync from Mobile App periodically?
   - Manual update in PM Tool?
   - Show both names?

4. **Multi-instance PM Tool?**
   - One PM Tool instance per company?
   - Or one PM Tool instance for all companies? ✅ Current architecture

