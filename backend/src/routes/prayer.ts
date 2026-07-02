import { Router, Request, Response } from 'express';
import * as prayerService from '../services/prayerService';

const router = Router();

// GET /api/prayer/times - Get prayer times by city
router.get('/times', async (req: Request, res: Response) => {
  try {
    const { city, country, method, date } = req.query;
    if (!city || !country) {
      return res.status(400).json({ success: false, error: 'City and country are required' });
    }
    const methodNum = parseInt((method as string) || '5');
    const times = await prayerService.getPrayerTimesByCity(
      city as string,
      country as string,
      methodNum,
      date as string
    );
    res.json({ success: true, data: times });
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch prayer times' });
  }
});

// GET /api/prayer/times-by-coords - Get prayer times by coordinates
router.get('/times-by-coords', async (req: Request, res: Response) => {
  try {
    const { lat, lng, method, date } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
    }
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ success: false, error: 'Invalid coordinates' });
    }
    const methodNum = parseInt((method as string) || '5');
    const times = await prayerService.getPrayerTimesByCoords(
      latitude, longitude, methodNum, date as string
    );
    res.json({ success: true, data: times });
  } catch (error) {
    console.error('Error fetching prayer times by coords:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch prayer times' });
  }
});

// GET /api/prayer/monthly - Monthly prayer times
router.get('/monthly', async (req: Request, res: Response) => {
  try {
    const { city, country, month, year, method } = req.query;
    if (!city || !country) {
      return res.status(400).json({ success: false, error: 'City and country are required' });
    }
    const now = new Date();
    const monthNum = parseInt((month as string) || String(now.getMonth() + 1));
    const yearNum = parseInt((year as string) || String(now.getFullYear()));
    const methodNum = parseInt((method as string) || '5');
    const times = await prayerService.getMonthlyPrayerTimes(
      city as string, country as string, monthNum, yearNum, methodNum
    );
    res.json({ success: true, data: times });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch monthly prayer times' });
  }
});

// GET /api/prayer/hijri - Get Hijri date
router.get('/hijri', async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const hijri = await prayerService.getHijriDate(date as string);
    res.json({ success: true, data: hijri });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to convert to Hijri date' });
  }
});

// GET /api/prayer/qibla - Calculate Qibla direction
router.get('/qibla', (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
    }
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ success: false, error: 'Invalid coordinates' });
    }
    const direction = prayerService.calculateQibla(latitude, longitude);
    res.json({
      success: true,
      data: {
        direction,
        latitude,
        longitude,
        kaaba: { latitude: 21.4225, longitude: 39.8262 }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to calculate Qibla' });
  }
});

// GET /api/prayer/methods - Get available calculation methods
router.get('/methods', (req: Request, res: Response) => {
  res.json({ success: true, data: prayerService.PRAYER_METHODS });
});

// GET /api/prayer/locations - Get list of countries and major cities
const LOCATIONS_DATA: Record<string, string[]> = {
  'Saudi Arabia': ['Makkah', 'Madinah', 'Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Taif', 'Tabuk', 'Buraidah', 'Abha'],
  'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Luxor', 'Aswan', 'Port Said', 'Suez', 'Mansoura', 'Tanta', 'Asyut'],
  'UAE': ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah'],
  'Kuwait': ['Kuwait City', 'Al Ahmadi', 'Hawalli'],
  'Qatar': ['Doha', 'Al Rayyan', 'Al Wakrah'],
  'Oman': ['Muscat', 'Salalah', 'Sohar', 'Nizwa'],
  'Bahrain': ['Manama', 'Muharraq', 'Riffa'],
  'Jordan': ['Amman', 'Zarqa', 'Irbid', 'Aqaba'],
  'Lebanon': ['Beirut', 'Tripoli', 'Sidon', 'Tyre'],
  'Turkey': ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Konya', 'Adana'],
  'Iran': ['Tehran', 'Mashhad', 'Isfahan', 'Shiraz', 'Tabriz', 'Qom'],
  'Pakistan': ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'],
  'India': ['Mumbai', 'Delhi', 'Hyderabad', 'Bangalore', 'Chennai', 'Kolkata', 'Lucknow'],
  'Bangladesh': ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna'],
  'Indonesia': ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Medan', 'Semarang', 'Makassar'],
  'Malaysia': ['Kuala Lumpur', 'George Town', 'Johor Bahru', 'Kota Kinabalu', 'Shah Alam'],
  'Morocco': ['Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tangier', 'Agadir'],
  'Algeria': ['Algiers', 'Oran', 'Constantine', 'Annaba'],
  'Tunisia': ['Tunis', 'Sfax', 'Sousse', 'Kairouan'],
  'Libya': ['Tripoli', 'Benghazi', 'Misrata'],
  'Sudan': ['Khartoum', 'Omdurman', 'Port Sudan'],
  'Somalia': ['Mogadishu', 'Hargeisa', 'Kismayo'],
  'Palestine': ['Jerusalem', 'Gaza', 'Ramallah', 'Hebron', 'Nablus'],
  'Syria': ['Damascus', 'Aleppo', 'Homs', 'Latakia'],
  'Iraq': ['Baghdad', 'Basra', 'Mosul', 'Erbil', 'Najaf', 'Karbala'],
  'Yemen': ['Sanaa', 'Aden', 'Taiz', 'Hudaydah'],
  'Mauritania': ['Nouakchott', 'Nouadhibou'],
  'Comoros': ['Moroni'],
  'Djibouti': ['Djibouti City'],
  'USA': ['New York', 'Chicago', 'Los Angeles', 'Houston', 'Detroit', 'Dallas', 'Washington DC'],
  'UK': ['London', 'Birmingham', 'Manchester', 'Leicester', 'Bradford', 'Glasgow'],
  'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa'],
  'Australia': ['Sydney', 'Melbourne', 'Perth', 'Brisbane', 'Adelaide'],
  'Germany': ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne', 'Stuttgart'],
  'France': ['Paris', 'Marseille', 'Lyon', 'Lille', 'Toulouse', 'Nice'],
  'Italy': ['Rome', 'Milan', 'Turin', 'Bologna', 'Florence'],
  'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Granada'],
  'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht'],
  'Sweden': ['Stockholm', 'Gothenburg', 'Malmo'],
  'Norway': ['Oslo', 'Bergen', 'Stavanger'],
  'Denmark': ['Copenhagen', 'Aarhus', 'Odense'],
  'Russia': ['Moscow', 'Saint Petersburg', 'Kazan', 'Grozny'],
  'China': ['Beijing', 'Shanghai', 'Guangzhou', 'Urumqi'],
  'Japan': ['Tokyo', 'Osaka', 'Nagoya'],
  'South Africa': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'],
  'Nigeria': ['Lagos', 'Abuja', 'Kano', 'Ibadan'],
  'Ethiopia': ['Addis Ababa', 'Dire Dawa'],
  'Kenya': ['Nairobi', 'Mombasa'],
  'Tanzania': ['Dar es Salaam', 'Zanzibar'],
  'Ghana': ['Accra', 'Kumasi'],
  'Senegal': ['Dakar', 'Touba'],
  'Mali': ['Bamako', 'Timbuktu'],
  'Niger': ['Niamey'],
  'Chad': ['N\'Djamena'],
  'Cameroon': ['Yaounde', 'Douala'],
  'Ivory Coast': ['Abidjan', 'Yamoussoukro'],
  'Burkina Faso': ['Ouagadougou', 'Bobo-Dioulasso'],
  'Guinea': ['Conakry'],
  'Benin': ['Porto-Novo', 'Cotonou'],
  'Togo': ['Lome'],
  'Sierra Leone': ['Freetown'],
  'Uganda': ['Kampala'],
  'Rwanda': ['Kigali'],
  'Burundi': ['Bujumbura'],
  'Mozambique': ['Maputo'],
  'Malawi': ['Lilongwe'],
  'Zambia': ['Lusaka'],
  'Zimbabwe': ['Harare'],
  'Botswana': ['Gaborone'],
  'Namibia': ['Windhoek'],
  'Mauritius': ['Port Louis'],
  'Seychelles': ['Victoria'],
  'Maldives': ['Male'],
  'Brunei': ['Bandar Seri Begawan'],
  'Singapore': ['Singapore'],
  'Thailand': ['Bangkok', 'Chiang Mai'],
  'Philippines': ['Manila', 'Quezon City'],
  'Vietnam': ['Ho Chi Minh City', 'Hanoi'],
  'South Korea': ['Seoul'],
  'Taiwan': ['Taipei'],
  'Hong Kong': ['Hong Kong'],
  'Argentina': ['Buenos Aires'],
  'Brazil': ['Brasilia', 'Sao Paulo', 'Rio de Janeiro'],
  'Suriname': ['Paramaribo'],
  'Guyana': ['Georgetown'],
  'Trinidad and Tobago': ['Port of Spain'],
  'Jamaica': ['Kingston'],
  'Barbados': ['Bridgetown'],
  'Fiji': ['Suva'],
  'New Zealand': ['Auckland', 'Wellington'],
};

router.get('/locations', (req: Request, res: Response) => {
  const countries = Object.keys(LOCATIONS_DATA).map(name => ({
    name,
    cities: LOCATIONS_DATA[name],
  }));
  res.json({ success: true, data: countries });
});

export default router;
