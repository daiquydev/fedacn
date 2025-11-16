import moduleAlias from 'module-alias'
import { join } from 'path'

const rootDir = join(__dirname, '..')

moduleAlias.addAlias('~', rootDir)
