const {Command } = require('commander');
const chalk = require('chalk');
const packageJSON = require('./package.json');
const  fs  = require('fs-extra'); // 加强版 增删改查
const path = require('path');
const  spawn  = require('cross-spawn');
async function init() {
    let projectName;
    new Command(packageJSON.name) // 项目明
    .version(packageJSON.version) // 版本号
    .arguments('<project-directory>') // 项目目录名
    .usage(`${chalk.green('<project-directory>')}`)
    .action((name) => {
        projectName = name;
    }).parse(process.argv) // node 完整路径，当前node脚本的路径，...其他参数
    console.log(projectName)
    await createApp(projectName)
}



async function createApp(appName) { // projectName
    let root = path.resolve(appName); // 得到将生成项目的绝对目录
    fs.ensureDirSync(appName); // 保证此目录是存在，如果不存在，则创建
    console.log(`Creating a new React app in ${chalk.green(root)}`);
    const packageJSON = {
        name:appName,
        version:'0.1.0',
        private:true
    }
    fs.writeFileSync(
        path.join(root, 'package.json'),
        JSON.stringify(packageJSON,null,2)
    );
    const originalDirectory = process.cwd(); // 原始的命令工作目录
    process.chdir(root); 
    console.log('appName',appName);
    console.log('root',root);
    console.log('originalDirectory',originalDirectory);

    // 安装包
    await run(root,appName,originalDirectory);
}

/**
 * 
 * @param {*} root 创建的项目的路径
 * @param {*} appName  项目名称
 * @param {*} originalDirectory 原来的工作目录
 */
async function run(root,appName,originalDirectory) {
    let scriptName = 'react-scripts'; // create生成的代码离，源文件编译，启动服务放在了react-scripts
    let templateName = 'cra-template';
    const allDependencies = ['react','react-dom',scriptName,templateName];
    console.log('Installing packages. This might take a couple of minutes.');
    console.log(
        `Installing ${chalk.cyan('react')},${chalk.cyan('react-dom')}, 
          and ${chalk.cyan(scriptName)}
          ${`with ${chalk.cyan(templateName)}`}...
        `
    )
    await install(root,allDependencies);
    // 项目根目录  项目的名字 verbose是否显示详细信息 原始的目录 模板名称 
    let data = [root,appName,true,originalDirectory,templateName];
    let source = `
        var init = require('react-scripts/scripts/init.js');
        init.apply(null,JSON.parse(process.argv[1]));
    `;
    await executeNodeScript({cwd:process.cwd()},data,source);
    console.log('Done');
    process.exit(0);
}

async function executeNodeScript({cwd},data,source) {
    return new Promise((resolve)=>{
        const child = spawn(
            process.execPath, // node可执行文件的路径
            ['-e',source,'--',JSON.stringify(data)],
            {cwd,stdio:'inherit'}
        )
    })
}

async function install(root, allDependencies) {
    return new Promise(resolve=>{
        const command = 'yarnpkg';
        const args = ['add','--exact',...allDependencies,'--cwd',root];
        console.log(Command,args);
        const child = spawn(command,args,{stdiio:'inherit'});
        child.on('close', resolve);

    })
}

module.exports = {
    init
}