export const prompt = {
  title: 'Webhook Implementation',
  description: 'Secure webhook handling with validation and processing',
  category: 'tool-calling',
  tags: ['webhooks', 'security', 'validation'],
  priority: 'high',
  useCount: 92,
  icon: '🔗',
  template: `Create a robust webhook handler:

**Webhook Source:** [e.g., GitHub, Stripe, Slack]
**Expected Events:** [List event types to handle]
**Processing Requirements:** [What to do with the data]

**Security Requirements:**
- Signature verification
- IP allowlisting (if applicable)
- Rate limiting
- Request validation

**Infrastructure:**
- Platform: [AWS Lambda, Express.js, etc.]
- Database: [for storing events, if needed]
- Queue system: [for async processing, if needed]

Please provide:
1. Complete webhook handler code
2. Security validation implementation
3. Event processing logic
4. Error handling and retry mechanisms
5. Monitoring and logging setup
6. Testing strategy with mock payloads`
};