import { GetScripts, ConfigurableLogger } from '@codestate/cli-api/main';

export async function showScriptsCommand() {
  const logger = new ConfigurableLogger();
  const getScripts = new GetScripts();
  const result = await getScripts.execute();
  if (result.ok) {
    const scripts = result.value;
    
    if (scripts.length === 0) {
      console.log('\n📝 No scripts found.');
      console.log('Use `codestate scripts create` to add your first script.\n');
      return;
    }
    
    // Group scripts by rootPath
    const scriptsByPath = new Map<string, typeof scripts>();
    scripts.forEach(script => {
      if (!scriptsByPath.has(script.rootPath)) {
        scriptsByPath.set(script.rootPath, []);
      }
      scriptsByPath.get(script.rootPath)!.push(script);
    });
    
    console.log('\n📝 Scripts by Project Path:');
    console.log('───────────────────────────');
    
    scriptsByPath.forEach((pathScripts, rootPath) => {
      console.log(`\n📁 ${rootPath} (${pathScripts.length} script${pathScripts.length > 1 ? 's' : ''})`);
      console.log('─'.repeat(rootPath.length + 10));
      
      pathScripts.forEach(script => {
        console.log(`  • ${script.name} - ${script.script}`);
      });
    });
    
    console.log('');
  } else {
    logger.error('Failed to load scripts', { error: result.error });
  }
} 