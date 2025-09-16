export const prompt = {
  title: 'Safe Database Migration',
  description: 'Zero-downtime database schema migrations with rollback plan',
  category: 'database',
  tags: ['migration', 'database', 'safety', 'rollback'],
  priority: 'high',
  useCount: 143,
  icon: '🗄️',
  template: `Plan a safe database migration:

**Current Schema:** 
[Describe current database structure]

**Desired Changes:**
[What needs to be changed - new tables, columns, indexes, etc.]

**Constraints:**
- Database type: [PostgreSQL, MySQL, MongoDB, etc.]
- Production data volume: [size, number of records]
- Acceptable downtime: [zero, minutes, hours]
- Peak traffic times: [when to avoid deployments]

**Migration Requirements:**
1. **Backwards Compatibility**: Ensure old app versions work during migration
2. **Data Integrity**: Preserve all existing data
3. **Performance**: Minimal impact on production queries
4. **Rollback Plan**: Quick way to undo if issues arise
5. **Validation**: Verify migration success

Please provide:
1. **Step-by-step migration plan** with timing estimates
2. **Migration scripts** (up and down migrations)
3. **Rollback procedures** 
4. **Validation queries** to confirm success
5. **Monitoring checklist** during deployment
6. **Risk assessment** and mitigation strategies`
};