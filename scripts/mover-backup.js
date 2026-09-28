import fs from 'fs'

const data = fs.readFileSync('src/assets/backup-folha-2026-09-27-40a44.json', 'utf8')
fs.writeFileSync('scripts/backup-folha-2026-09-27-40a44.json', data, 'utf8')
fs.unlinkSync('src/assets/backup-folha-2026-09-27-40a44.json')
console.log('Arquivo movido de src/assets para scripts/ com sucesso.')
