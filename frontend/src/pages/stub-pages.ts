// This file creates stub components for pages that haven't been fully implemented yet
// Each page will have basic structure and can be expanded later

export const createStubPage = (pageName: string) => {
  return `
import { motion } from 'framer-motion'

const ${pageName} = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">${pageName}</h1>
        <p className="text-gray-600">This page is under construction.</p>
      </div>
    </motion.div>
  )
}

export default ${pageName}
`
}