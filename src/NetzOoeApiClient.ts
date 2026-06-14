import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'
import axios, { AxiosInstance, AxiosResponse, RawAxiosResponseHeaders } from 'axios'
import { BusinessPartnerOverview, Credentials, MeterData, MeterdataRequest } from './model/models'
import { NetzOoeAuthenticationError, NetzOoeRequestError, NetzOoeSessionError } from './errors'

export class NetzOoeApiClient {
  client: AxiosInstance
  private jar = new CookieJar()
  private credentials: Credentials
  private xsrfToken: string = ''
  private readonly SERVICE_BASE_URL = 'service/v1.0/'
  private readonly SESSION_ENDPOINT = this.SERVICE_BASE_URL + 'session'
  private readonly CONSUMPTION_ENDPOINT = this.SERVICE_BASE_URL + 'consumptions/profile/active'
  private readonly DASHBOARD_ENDPOINT = this.SERVICE_BASE_URL + 'dashboard'

  constructor(credentials: Credentials) {
    this.credentials = credentials
    this.client = wrapper(
      axios.create({
        jar: this.jar,
        baseURL: 'https://eservice.netzooe.at/',
        headers: {
          'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          authority: 'eservice.netzooe.at',
          'content-type': 'application/json',
          origin: 'https://eservice.netzooe.at',
          'client-id': 'netzonline'
        }
      })
    )
  }

  public async performAuthFlow() {
    await this.getLoginPage()
    await this.performLogin()
    this.xsrfToken = await this.getSessionInformation()
  }

  public async getMeterData(meterDataRequest: MeterdataRequest): Promise<MeterData> {
    return this.client
      .post(this.CONSUMPTION_ENDPOINT, meterDataRequest, {
        maxBodyLength: Infinity,
        headers: { 'x-xsrf-token': this.xsrfToken }
      })
      .then((response: AxiosResponse<MeterData[], any>) => {
        const data = response.data.shift()
        if (!data) throw new NetzOoeRequestError('No meter data returned for the given request')
        return data
      })
      .catch((error) => {
        if (error instanceof NetzOoeRequestError) throw error
        throw new NetzOoeRequestError('Failed to fetch meter data', { cause: error })
      })
  }

  async getDashboardView(): Promise<BusinessPartnerOverview> {
    return this.client
      .get(this.DASHBOARD_ENDPOINT, {
        headers: { 'x-xsrf-token': this.xsrfToken }
      })
      .then((response: AxiosResponse<BusinessPartnerOverview, any>) => response.data)
      .catch((error) => {
        throw new NetzOoeRequestError('Failed to fetch dashboard data', { cause: error })
      })
  }

  /**
   * Generates an array of strings in the format YYYY-MM-DD representing the date range between two given dates.
   *
   * @param {Date} from - The starting date.
   * @param {Date} to - The ending date.
   * @return {string[]} - An array of strings representing the date range between from and to.
   */
  public generateDateRange(from: Date, to: Date): string[] {
    //Create new dates to avoid mutating the input
    const copiedFrom = new Date(from)
    const copiedTo = new Date(to)
    const result: string[] = []
    while (copiedFrom <= copiedTo) {
      result.push(copiedFrom.toISOString().slice(0, 10))
      copiedFrom.setDate(copiedFrom.getDate() + 1) //add one day to from-date
    }
    return result
  }

  /**
   * Builds a meter data request object.
   *
   * @param {string} date - The date for the request in "YYYY-MM-DD" format.
   * @param {string} contractAccountNumber - The contract account number (Vertragskontonummer).
   * @param {string} meterPointNumber - The meter point number (Zählpunktnummer).
   * @param {string} [dimension="ENERGY"] - The dimension of the meter data (default is "ENERGY").
   * @returns MeterdataRequest - The meter data request object.
   */
  public buildMeterdataRequest(date: string, contractAccountNumber: string, meterPointNumber: string, dimension: string = "ENERGY"): MeterdataRequest {
    return {
      "dimension": dimension,
      "pods": [
        {
          "contractAccountNumber": contractAccountNumber,
          "meterPointAdministrationNumber": meterPointNumber,
          "type": "ACTIVE_CURRENT",
          "timerange": {
            "from": date,
            "to": date
          },
          "bestAvailableGranularity": "QUARTER_OF_AN_HOUR"
        }
      ]
    }
  }

  private async getLoginPage() {
    return this.client.get('app/login').catch((error) => {
      throw new NetzOoeRequestError('Failed to load login page', { cause: error })
    })
  }

  private async performLogin() {
    return this.client.post('service/j_security_check', this.credentials).catch((error) => {
      throw new NetzOoeAuthenticationError('Authentication failed — check your credentials', { cause: error })
    })
  }

  private async getSessionInformation(): Promise<string> {
    const response = await this.client.get(this.SESSION_ENDPOINT).catch((error) => {
      throw new NetzOoeRequestError('Failed to retrieve session information', { cause: error })
    })
    return this.extractXsrfToken(response.headers)
  }

  private extractXsrfToken(headers: RawAxiosResponseHeaders): string {
    const setCookieHeader = headers['set-cookie']
    if (!setCookieHeader) throw new NetzOoeSessionError('No set-cookie header in session response')
    const regex = /XSRF-TOKEN=([^\s;]+)/
    for (const item of setCookieHeader) {
      const match = item.match(regex)
      if (match) return match[1]
    }
    throw new NetzOoeSessionError('XSRF token not found in session cookies')
  }
}
