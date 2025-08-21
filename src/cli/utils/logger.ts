import pc from 'picocolors'

export const logger = {
  info: (message: string) => {
    console.log(pc.blue('ℹ'), message)
  },
  
  success: (message: string) => {
    console.log(pc.green('✓'), message)
  },
  
  warn: (message: string) => {
    console.log(pc.yellow('⚠'), message)
  },
  
  error: (message: string) => {
    console.log(pc.red('✗'), message)
  },
  
  dim: (message: string) => {
    console.log(pc.gray(message))
  },
  
  highlight: (message: string) => {
    console.log(pc.cyan(message))
  },
  
  log: (message: string) => {
    console.log(message)
  }
}