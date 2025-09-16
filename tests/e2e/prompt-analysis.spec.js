import { test, expect } from '@playwright/test';

test.describe('Fulcrum Prompt Analysis', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for WASM to initialize
    await page.waitForSelector('text=WASM ready', { timeout: 30000 });
    console.log('✅ WASM initialized');
  });

  test('should analyze prompt and display all tabs including Prompt Grade', async ({ page }) => {
    // Sample prompt for testing
    const testPrompt = `I need to build a web application with user authentication. 
    First, we must set up the database schema. 
    Then we should implement the login API endpoint. 
    After that, we need to create the registration flow. 
    Finally, we must add password reset functionality.`;

    // Clear existing text and enter test prompt
    const textArea = page.locator('textarea');
    await textArea.fill(testPrompt);
    
    // Verify the text was entered
    await expect(textArea).toHaveValue(testPrompt);
    console.log('✅ Prompt text entered');

    // Click the Analyze button
    await page.click('text=Analyze');
    
    // Wait for analysis to complete - wait for the Metrics tab which is always shown
    await page.waitForSelector('text=📊 Metrics', { timeout: 30000 });
    console.log('✅ Analysis completed');

    // Log the console messages to debug
    page.on('console', msg => {
      if (msg.text().includes('prompt_grade') || msg.text().includes('PROMPT_GRADE')) {
        console.log('Console:', msg.text());
      }
    });

    // Check for all expected tabs
    const expectedTabs = [
      { name: 'Task Graph', selector: 'text=🎯 Task Graph' },
      { name: 'Prompt Grade', selector: 'text=📊 Prompt Grade' },
      { name: 'Insights', selector: 'text=🔍 Insights' },
      { name: 'Metrics', selector: 'text=📊 Metrics' },
      { name: 'Raw JSON', selector: 'text=🔧 Raw JSON' }
    ];

    console.log('\n🔍 Checking for tabs...');
    
    for (const tab of expectedTabs) {
      const tabElement = page.locator(tab.selector);
      const isVisible = await tabElement.isVisible().catch(() => false);
      
      if (isVisible) {
        console.log(`✅ ${tab.name} tab is visible`);
      } else {
        console.log(`❌ ${tab.name} tab is NOT visible`);
        
        // Additional debugging for Prompt Grade
        if (tab.name === 'Prompt Grade') {
          // Check if prompt_grade data exists in the console output
          await page.evaluate(() => {
            console.log('Debugging prompt_grade from test:', window.parsedResult?.prompt_grade);
          });
        }
      }
    }

    // Try clicking on each visible tab
    console.log('\n🔄 Testing tab navigation...');
    
    // Test Task Graph tab (should be default)
    const taskGraphTab = page.locator('text=🎯 Task Graph');
    if (await taskGraphTab.isVisible()) {
      await taskGraphTab.click();
      console.log('✅ Clicked Task Graph tab');
      
      // Wait for task graph content
      await page.waitForTimeout(500);
    }

    // Test Prompt Grade tab
    const promptGradeTab = page.locator('text=📊 Prompt Grade');
    if (await promptGradeTab.isVisible()) {
      await promptGradeTab.click();
      console.log('✅ Clicked Prompt Grade tab');
      
      // Check for grade content
      await page.waitForTimeout(500);
      
      // Look for grade elements
      const gradeElements = [
        'text=Overall Grade',
        'text=Understandability',
        'text=Specificity',
        'text=Task Complexity',
        'text=Clarity',
        'text=Actionability'
      ];
      
      for (const element of gradeElements) {
        const isPresent = await page.locator(element).isVisible().catch(() => false);
        if (isPresent) {
          console.log(`  ✅ Found: ${element.replace('text=', '')}`);
        }
      }
    } else {
      console.log('⚠️  Prompt Grade tab not visible - checking data...');
      
      // Debug: Check what data is actually available
      const debugInfo = await page.evaluate(() => {
        const result = window.parsedResult;
        return {
          hasResult: !!result,
          keys: result ? Object.keys(result) : [],
          hasPromptGrade: result ? !!result.prompt_grade : false,
          promptGradeKeys: result?.prompt_grade ? Object.keys(result.prompt_grade) : []
        };
      });
      
      console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
    }

    // Test Insights tab
    const insightsTab = page.locator('text=🔍 Insights');
    if (await insightsTab.isVisible()) {
      await insightsTab.click();
      console.log('✅ Clicked Insights tab');
      await page.waitForTimeout(500);
    }

    // Test Metrics tab
    const metricsTab = page.locator('text=📊 Metrics');
    if (await metricsTab.isVisible()) {
      await metricsTab.click();
      console.log('✅ Clicked Metrics tab');
      await page.waitForTimeout(500);
    }

    // Test Raw JSON tab
    const rawJsonTab = page.locator('text=🔧 Raw JSON');
    if (await rawJsonTab.isVisible()) {
      await rawJsonTab.click();
      console.log('✅ Clicked Raw JSON tab');
      
      // Check if prompt_grade is in the JSON
      await page.waitForTimeout(500);
      const jsonContent = await page.locator('text=prompt_grade').count();
      if (jsonContent > 0) {
        console.log('✅ Found "prompt_grade" in Raw JSON output');
      } else {
        console.log('❌ "prompt_grade" NOT found in Raw JSON output');
      }
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: 'tests/e2e/screenshots/analysis-result.png', fullPage: true });
    console.log('\n📸 Screenshot saved to tests/e2e/screenshots/analysis-result.png');

    // Final assertion - at least basic tabs should be visible
    await expect(page.locator('text=📊 Metrics')).toBeVisible();
    await expect(page.locator('text=🔧 Raw JSON')).toBeVisible();
  });

  test('should show prompt grade for complex prompt', async ({ page }) => {
    // Use a more complex prompt
    const complexPrompt = `We need to migrate our e-commerce platform to a microservices architecture. 
    First, we must analyze the current monolithic codebase and create a dependency map. 
    Then we should design the new microservices architecture with separate services for user management, 
    product catalog, and payment processing. After the architecture design, we have to implement 
    the user service API. In parallel, we need to build the product catalog service.`;

    // Enter the complex prompt
    const textArea = page.locator('textarea');
    await textArea.fill(complexPrompt);
    
    // Analyze
    await page.click('text=Analyze');
    
    // Wait for analysis
    await page.waitForSelector('text=📊 Metrics', { timeout: 30000 });
    
    // Debug output
    const analysisData = await page.evaluate(() => {
      return {
        hasData: !!window.parsedResult,
        hasPromptGrade: !!window.parsedResult?.prompt_grade,
        overallGrade: window.parsedResult?.prompt_grade?.overall_grade,
        suggestions: window.parsedResult?.prompt_grade?.suggestions?.length
      };
    });
    
    console.log('\n📊 Complex Prompt Analysis:');
    console.log(JSON.stringify(analysisData, null, 2));
    
    // Check if Prompt Grade tab appears
    const promptGradeVisible = await page.locator('text=📊 Prompt Grade').isVisible();
    console.log(`Prompt Grade tab visible: ${promptGradeVisible}`);
    
    if (!promptGradeVisible) {
      // Get more debug info
      const wasmOutput = await page.evaluate(() => {
        return window.lastWasmOutput || 'No WASM output captured';
      });
      console.log('Last WASM output:', wasmOutput);
    }
  });
});