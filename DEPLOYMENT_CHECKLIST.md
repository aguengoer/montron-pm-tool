# 🚀 Deployment Checklist - Tagesdetail 3-Column View

## Pre-Deployment

### 1. Backend Verification
- [ ] Backend compiles successfully
  ```bash
  cd montron-pm-tool/backend
  ./mvnw clean compile
  ```

- [ ] All tests pass
  ```bash
  ./mvnw test
  ```

- [ ] Service token authentication works
  ```bash
  # Test with curl
  curl http://localhost:8080/api/employees/{id}/tagesdetail/2025-12-05 \
    -H "Authorization: Bearer YOUR_JWT"
  ```

### 2. Frontend Verification
- [ ] Frontend compiles successfully
  ```bash
  cd montron-pm-tool/pm-web-frontend
  npm run build
  ```

- [ ] No TypeScript errors
  ```bash
  npm run type-check
  ```

- [ ] Lint passes
  ```bash
  npm run lint
  ```

### 3. Integration Verification
- [ ] Mobile App backend is running (port 8090)
- [ ] PM Tool backend is running (port 8080)
- [ ] Service token is configured
- [ ] Both systems can communicate

## Deployment Steps

### Step 1: Deploy Backend

```bash
# 1. Stop current backend
# (If using systemd)
sudo systemctl stop montron-pm-backend

# 2. Build production JAR
cd montron-pm-tool/backend
./mvnw clean package -DskipTests

# 3. Copy JAR to deployment location
cp target/backend-*.jar /opt/montron-pm/backend.jar

# 4. Start backend
sudo systemctl start montron-pm-backend

# 5. Verify it's running
curl http://localhost:8080/actuator/health
```

### Step 2: Deploy Frontend

```bash
# 1. Build production bundle
cd montron-pm-tool/pm-web-frontend
npm run build

# 2. Test production build locally
npm run start

# 3. Deploy to server
# (Example: rsync to nginx server)
rsync -avz .next/ user@server:/var/www/montron-pm/

# 4. Restart web server
sudo systemctl restart nginx
```

### Step 3: Smoke Testing

#### Test 1: Homepage loads
- [ ] Navigate to: `http://your-domain.com/mitarbeiter`
- [ ] Page loads without errors
- [ ] Employee list displays

#### Test 2: Date selection
- [ ] Click on an employee
- [ ] Date selection page loads
- [ ] Calendar displays correctly

#### Test 3: Tagesdetail view
- [ ] Select a date with submissions
- [ ] 3-column layout displays
- [ ] All three columns load:
  - [ ] Tagesbericht (left)
  - [ ] Regiescheine (middle)
  - [ ] Streetwatch + Prüfhinweise (right)

#### Test 4: Editing
- [ ] Click on a field
- [ ] Change the value
- [ ] Field shows yellow border
- [ ] Old value shows below (strikethrough)
- [ ] Save button shows badge counter

#### Test 5: Saving
- [ ] Click "Speichern" button
- [ ] Toast notification appears
- [ ] Changes are persisted
- [ ] Page refreshes data

#### Test 6: Validation
- [ ] Validation panel shows issues
- [ ] Click on validation issue
- [ ] Page scrolls to field
- [ ] Field is highlighted

#### Test 7: Responsive
- [ ] Test on mobile device
- [ ] Columns stack vertically
- [ ] All features still work
- [ ] Touch interactions work

## Post-Deployment

### Monitoring

#### 1. Backend Health
```bash
# Check logs
tail -f /var/log/montron-pm/backend.log

# Check metrics
curl http://localhost:8080/actuator/metrics
```

#### 2. Frontend Performance
- [ ] Check browser console for errors
- [ ] Verify page load time < 3s
- [ ] Check Network tab for failed requests

#### 3. Database
```sql
-- Check submission updates
SELECT * FROM submissions 
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;
```

### Rollback Plan

If issues occur:

```bash
# 1. Rollback backend
sudo systemctl stop montron-pm-backend
cp /opt/montron-pm/backend.jar.backup /opt/montron-pm/backend.jar
sudo systemctl start montron-pm-backend

# 2. Rollback frontend
# Restore previous .next/ directory
rsync -avz /var/www/montron-pm.backup/ /var/www/montron-pm/
sudo systemctl restart nginx
```

## Environment-Specific

### Development
- [x] Localhost testing complete
- [x] Service token configured locally
- [x] Both backends running

### Staging
- [ ] Deploy to staging server
- [ ] Run full test suite
- [ ] User acceptance testing
- [ ] Performance testing

### Production
- [ ] All staging tests passed
- [ ] Backup current deployment
- [ ] Deploy during maintenance window
- [ ] Run smoke tests
- [ ] Monitor for 24 hours

## Troubleshooting

### Issue: "Cannot connect to backend"
**Check:**
- [ ] Backend is running: `systemctl status montron-pm-backend`
- [ ] Port 8080 is open: `netstat -tulpn | grep 8080`
- [ ] Firewall rules allow connections

### Issue: "401 Unauthorized"
**Check:**
- [ ] Service token is configured
- [ ] Token hasn't been revoked
- [ ] Mobile app backend is accessible

### Issue: "Form not loading"
**Check:**
- [ ] Mobile app has form definition
- [ ] `/api/forms/{id}` endpoint works
- [ ] Form ID matches between systems

### Issue: "Changes not saving"
**Check:**
- [ ] `/api/submissions/{id}` endpoint implemented
- [ ] User has permission to edit
- [ ] Database connection is healthy

## Success Metrics

After 24 hours, verify:
- [ ] No 5xx errors in logs
- [ ] < 1% 4xx errors
- [ ] Average response time < 500ms
- [ ] No user complaints
- [ ] All features working as expected

## Communication

### Notify Users
```
Subject: New Tagesdetail View Live

We've updated the daily detail view with:
- Improved 3-column layout
- Inline editing for all fields
- Real-time validation
- Better mobile experience

Please report any issues to support@montron.com
```

### Internal Team
- [ ] Notify backend team of deployment
- [ ] Update internal documentation
- [ ] Schedule training session if needed

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Sign-off:** _____________

