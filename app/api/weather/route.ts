import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/weather?zip=12345
 * OR
 * GET /api/weather?lat=30.2672&lon=-97.7431
 *
 * Fetch weather data for a given location
 * Uses Open-Meteo API (free, no API key required)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const zip = searchParams.get('zip')
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')

    let latitude: number
    let longitude: number
    let city: string
    let state: string

    // Option 1: Use provided lat/long (preferred - from stored organization data)
    if (lat && lon) {
      latitude = parseFloat(lat)
      longitude = parseFloat(lon)

      // Use reverse geocoding to get city/state (optional - can skip for now)
      // For now, just set generic location
      city = 'Your Location'
      state = ''
    }
    // Option 2: Get coordinates from ZIP code
    else if (zip) {
      const geoResponse = await fetch(`https://api.zippopotam.us/us/${zip}`)

      if (!geoResponse.ok) {
        return NextResponse.json(
          { error: 'Invalid ZIP code' },
          { status: 400 }
        )
      }

      const geoData = await geoResponse.json()
      latitude = parseFloat(geoData.places[0].latitude)
      longitude = parseFloat(geoData.places[0].longitude)
      city = geoData.places[0]['place name']
      state = geoData.places[0]['state abbreviation']
    }
    // No location provided
    else {
      return NextResponse.json(
        { error: 'ZIP code or lat/lon is required' },
        { status: 400 }
      )
    }

    // Get weather from Open-Meteo
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York`
    )

    if (!weatherResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch weather data' },
        { status: 500 }
      )
    }

    const weatherData = await weatherResponse.json()

    // Map weather codes to conditions and icons
    const getWeatherInfo = (code: number) => {
      // WMO Weather interpretation codes
      if (code === 0) return { condition: 'Clear', icon: '☀️' }
      if (code === 1 || code === 2) return { condition: 'Partly Cloudy', icon: '⛅' }
      if (code === 3) return { condition: 'Cloudy', icon: '☁️' }
      if (code >= 45 && code <= 48) return { condition: 'Foggy', icon: '🌫️' }
      if (code >= 51 && code <= 57) return { condition: 'Drizzle', icon: '🌦️' }
      if (code >= 61 && code <= 67) return { condition: 'Rain', icon: '🌧️' }
      if (code >= 71 && code <= 77) return { condition: 'Snow', icon: '🌨️' }
      if (code >= 80 && code <= 82) return { condition: 'Rain Showers', icon: '🌧️' }
      if (code >= 85 && code <= 86) return { condition: 'Snow Showers', icon: '🌨️' }
      if (code >= 95 && code <= 99) return { condition: 'Thunderstorm', icon: '⛈️' }
      return { condition: 'Unknown', icon: '🌡️' }
    }

    const weatherInfo = getWeatherInfo(weatherData.current.weather_code)

    return NextResponse.json({
      location: `${city}, ${state}`,
      temperature: Math.round(weatherData.current.temperature_2m),
      condition: weatherInfo.condition,
      icon: weatherInfo.icon,
      windSpeed: Math.round(weatherData.current.wind_speed_10m),
      lastUpdated: weatherData.current.time
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/weather:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
