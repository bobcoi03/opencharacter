import { Check, Minus } from "lucide-react"
import { getFreeModelArray, getPaidModelArray } from "@/lib/llm_models"
import Link from "next/link"

const ModelComparison = () => {
  const freeModels = getFreeModelArray()
  const paidModels = getPaidModelArray()

  return (
    <div className="mt-16 px-4 sm:px-6 max-w-5xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-8">Available Models</h2>
      <div className="text-center mb-6">
        <p className="text-zinc-400 mb-4">
          Compare available models across our subscription plans. Pro users get access to all premium models.
        </p>
        <Link 
          href="/models"
          className="inline-flex items-center justify-center rounded-full border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 hover:text-white transition-colors"
        >
          View detailed model specifications
        </Link>
      </div>
      <div className="-mx-4 sm:mx-0">
        <div className="inline-block min-w-full py-2 align-middle">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead>
                <tr className="bg-zinc-900/50">
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-6 w-[60%]">Model</th>
                  <th scope="col" className="w-[20%] px-3 py-3.5 text-center text-sm font-semibold">Hobby</th>
                  <th scope="col" className="w-[20%] px-3 py-3.5 text-center text-sm font-semibold">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-900/30">
                {/* Free Models */}
                {freeModels.map((model, index) => (
                  <tr key={index}>
                    <td className="break-words py-4 pl-4 pr-3 text-sm sm:pl-6">{model.name}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-center">
                      <Check className="mx-auto h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-center">
                      <Check className="mx-auto h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    </td>
                  </tr>
                ))}
                {/* Paid Models */}
                {paidModels.map((model, index) => (
                  <tr key={index}>
                    <td className="break-words py-4 pl-4 pr-3 text-sm sm:pl-6">{model.name}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-center">
                      <Minus className="mx-auto h-4 w-4 sm:h-5 sm:w-5 text-zinc-500" />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-center">
                      <Check className="mx-auto h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModelComparison 