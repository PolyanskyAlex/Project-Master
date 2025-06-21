// Диагностический скрипт для проверки расширения Project Master
// Выполните в консоли Cursor IDE (Developer Tools)

console.log('=== PROJECT MASTER DIAGNOSTIC SCRIPT ===');

// 1. Проверка установленных расширений
const projectMasterExtension = vscode.extensions.getExtension('project-master.project-master-extension');
console.log('Extension installed:', !!projectMasterExtension);
console.log('Extension details:', projectMasterExtension);

if (projectMasterExtension) {
    console.log('Extension active:', projectMasterExtension.isActive);
    console.log('Extension path:', projectMasterExtension.extensionPath);
    console.log('Extension exports:', projectMasterExtension.exports);
}

// 2. Проверка доступных команд
vscode.commands.getCommands(true).then(commands => {
    const projectMasterCommands = commands.filter(cmd => cmd.startsWith('projectMaster.'));
    console.log('Total commands in VS Code:', commands.length);
    console.log('Project Master commands found:', projectMasterCommands.length);
    console.log('Project Master commands:', projectMasterCommands);
    
    // Проверка конкретных команд
    const expectedCommands = [
        'projectMaster.refreshProjects',
        'projectMaster.test',
        'projectMaster.syncPlan'
    ];
    
    expectedCommands.forEach(cmd => {
        const found = commands.includes(cmd);
        console.log(`Command ${cmd}: ${found ? '✅ FOUND' : '❌ MISSING'}`);
    });
});

// 3. Попытка активации расширения
if (projectMasterExtension && !projectMasterExtension.isActive) {
    console.log('Attempting to activate extension...');
    projectMasterExtension.activate().then(() => {
        console.log('Extension activated successfully');
    }).catch(error => {
        console.error('Failed to activate extension:', error);
    });
}

console.log('=== DIAGNOSTIC SCRIPT COMPLETED ==='); 