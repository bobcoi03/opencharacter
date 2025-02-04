import { Check, Minus } from "lucide-react"

const FeatureComparison = () => {
  const features = [
    { name: "Access to basic models", hobby: true, pro: true },
    { name: "Unlimited completions", hobby: true, pro: true },
    { name: "Characters", hobby: true, pro: true },
    { name: "Personas", hobby: true, pro: true },
    { name: "No ads", hobby: false, pro: true },
    { name: "Access to all models", hobby: false, pro: true },
    { name: "Unlimited premium model completions", hobby: false, pro: true },
    { name: "Creator Dashboard", hobby: false, pro: true },
    { name: "Priority support", hobby: false, pro: true },
    { name: "Profile badge", hobby: false, pro: true },
  ]

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold text-center mb-8">Feature Comparison</h2>
      <div className="overflow-x-auto">
        <table className="w-full max-w-4xl mx-auto">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="py-4 px-6 text-left">Feature</th>
              <th className="py-4 px-6 text-center">Hobby</th>
              <th className="py-4 px-6 text-center">Pro</th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr key={index} className="border-b border-zinc-800">
                <td className="py-4 px-6">{feature.name}</td>
                <td className="py-4 px-6 text-center">
                  {feature.hobby ? (
                    <Check className="mx-auto h-5 w-5 text-green-500" />
                  ) : (
                    <Minus className="mx-auto h-5 w-5 text-zinc-500" />
                  )}
                </td>
                <td className="py-4 px-6 text-center">
                  <Check className="mx-auto h-5 w-5 text-green-500" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default FeatureComparison

