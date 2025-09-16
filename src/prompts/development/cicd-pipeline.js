export const prompt = {
  title: 'CI/CD Pipeline Setup',
  description: 'Automated deployment pipeline with quality gates',
  category: 'development',
  tags: ['cicd', 'deployment', 'automation'],
  priority: 'high',
  useCount: 87,
  icon: '🚀',
  template: `Design a robust CI/CD pipeline:

**Application:**
- Technology: [language, framework]
- Infrastructure: [AWS, GCP, Azure, on-premise]
- Deployment target: [containers, serverless, VMs]

**Current State:**
[Describe current deployment process]

**Pipeline Requirements:**
1. **Source Control**: Trigger on commits/PRs
2. **Build Process**: Compile, package, containerize
3. **Quality Gates**: Tests, linting, security scans
4. **Deployment Stages**: dev → staging → production
5. **Monitoring**: Health checks and rollback capability

**Quality Standards:**
- Test coverage threshold: [percentage]
- Security scanning: [SAST, DAST, dependency check]
- Performance benchmarks: [load times, throughput]

**Constraints:**
- Budget: [cost considerations]
- Team expertise: [current DevOps knowledge]
- Compliance: [regulatory requirements, if any]

Provide:
1. **Pipeline architecture** diagram
2. **Configuration files** (GitHub Actions, GitLab CI, etc.)
3. **Quality gate definitions**
4. **Rollback procedures**
5. **Monitoring and alerting** setup
6. **Documentation** for the team`
};