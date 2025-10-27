import { NextResponse } from 'next/server'

// Rule-based AI suggestion engine for homeopathy
const symptomRules: Record<string, any[]> = {
  'fever': [
    { medicine: 'Belladonna', potency: '30C', dosage: '4 drops', frequency: 'TDS', reason: 'High fever with inflammation' },
    { medicine: 'Ferrum Phos', potency: '6X', dosage: '4 tablets', frequency: 'QID', reason: 'Early stage fever' },
  ],
  'headache': [
    { medicine: 'Belladonna', potency: '30C', dosage: '4 drops', frequency: 'TDS', reason: 'Throbbing headache' },
    { medicine: 'Nux Vomica', potency: '30C', dosage: '4 drops', frequency: 'BD', reason: 'Headache from stress' },
  ],
  'cold': [
    { medicine: 'Pulsatilla', potency: '30C', dosage: '4 drops', frequency: 'TDS', reason: 'Thick yellow discharge' },
    { medicine: 'Allium Cepa', potency: '30C', dosage: '4 drops', frequency: 'QID', reason: 'Watery discharge' },
  ],
  'cough': [
    { medicine: 'Bryonia', potency: '30C', dosage: '4 drops', frequency: 'TDS', reason: 'Dry painful cough' },
    { medicine: 'Drosera', potency: '30C', dosage: '4 drops', frequency: 'TDS', reason: 'Spasmodic cough' },
  ],
  'stomach': [
    { medicine: 'Nux Vomica', potency: '30C', dosage: '4 drops', frequency: 'TDS', reason: 'Indigestion, acidity' },
    { medicine: 'Carbo Veg', potency: '30C', dosage: '4 drops', frequency: 'BD', reason: 'Bloating, gas' },
  ],
  'pain': [
    { medicine: 'Arnica', potency: '30C', dosage: '4 drops', frequency: 'TDS', reason: 'Trauma, bruises' },
    { medicine: 'Rhus Tox', potency: '30C', dosage: '4 drops', frequency: 'TDS', reason: 'Joint pain, stiffness' },
  ],
}

export async function POST(req: Request) {
  try {
    const { symptoms, diagnosis } = await req.json()
    
    if (!symptoms) {
      return NextResponse.json({ success: false, error: 'Symptoms required' }, { status: 400 })
    }

    // Simple keyword matching
    const symptomsLower = symptoms.toLowerCase()
    const suggestions: any[] = []
    
    Object.keys(symptomRules).forEach(keyword => {
      if (symptomsLower.includes(keyword)) {
        suggestions.push(...symptomRules[keyword])
      }
    })

    // Remove duplicates
    const unique = suggestions.filter((s, i, arr) => 
      arr.findIndex(t => t.medicine === s.medicine) === i
    )

    // If no matches, provide general suggestions
    if (unique.length === 0) {
      unique.push({
        medicine: 'Arnica', 
        potency: '30C', 
        dosage: '4 drops', 
        frequency: 'TDS',
        reason: 'General remedy for trauma and pain'
      })
    }

    return NextResponse.json({ 
      success: true, 
      suggestions: unique.slice(0, 5), // Limit to top 5
      message: `Found ${unique.length} suggestions based on symptoms`
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
