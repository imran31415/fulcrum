export const prompt = {
  title: 'System Architecture Review',
  description: 'Comprehensive architecture analysis and recommendations',
  category: 'cursor-agent',
  tags: ['architecture', 'design', 'scalability'],
  priority: 'medium',
  useCount: 89,
  icon: '🏗️',
  template: `Review and improve this system architecture:

**Current Architecture:**
[Describe current system design, components, data flow]

**Requirements:**
- Expected scale: [users, requests, data volume]
- Performance needs: [latency, throughput requirements]
- Reliability needs: [uptime, fault tolerance]
- Budget constraints: [cost considerations]

**Areas of Concern:**
[List specific issues or bottlenecks]

Please provide:
1. **Analysis** of current architecture strengths/weaknesses
2. **Recommendations** for improvements
3. **Migration Strategy** if changes are needed
4. **Trade-offs** for each recommendation
5. **Implementation Timeline** with priorities`
};