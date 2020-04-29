import program from 'commander'
import _ from 'lodash'

program
  .command('command1 [arg1]')
  .description('test command')
  .action((arg1) => {
    console.log('this is command1, and argument is', arg1)
  })

program.on('--help', function(){
  console.log('')
});
 
program.parse(process.argv);
