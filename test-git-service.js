#!/usr/bin/env node

// Simple test script to verify Git and Terminal services
import { GitFacade } from './packages/core/services/git/GitFacade.js';
import { TerminalFacade } from './packages/infrastructure/services/TerminalFacade.js';

async function testServices() {
  console.log('🧪 Testing Git and Terminal Services...\n');

  try {
    // Test Terminal Service
    console.log('1️⃣ Testing Terminal Service...');
    const terminal = new TerminalFacade();
    
    // Test basic command execution
    const result = await terminal.execute('echo "Hello from Terminal Service"');
    if (result.ok) {
      console.log('✅ Terminal service works:', result.value.stdout);
    } else {
      console.log('❌ Terminal service failed:', result.error.message);
    }

    // Test Git Service
    console.log('\n2️⃣ Testing Git Service...');
    const git = new GitFacade();
    
    // Check if we're in a git repository
    const isRepo = await git.isGitRepository();
    if (isRepo.ok && isRepo.value) {
      console.log('✅ In a git repository');
      
      // Get current branch
      const branch = await git.getCurrentBranch();
      if (branch.ok) {
        console.log('✅ Current branch:', branch.value);
      }
      
      // Check if dirty
      const isDirty = await git.getIsDirty();
      if (isDirty.ok) {
        console.log('✅ Repository dirty status:', isDirty.value);
      }
      
      // Get status
      const status = await git.getStatus();
      if (status.ok) {
        console.log('✅ Git status retrieved');
        console.log('   - Is dirty:', status.value.isDirty);
        console.log('   - Modified files:', status.value.modifiedFiles.length);
        console.log('   - New files:', status.value.newFiles.length);
        console.log('   - Untracked files:', status.value.untrackedFiles.length);
      }
      
    } else {
      console.log('⚠️  Not in a git repository or git not available');
    }

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testServices(); 