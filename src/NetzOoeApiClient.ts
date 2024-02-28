import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'
import axios, { AxiosInstance, AxiosResponse, RawAxiosResponseHeaders } from 'axios'
import { BusinessPartnerOverview, Credentials, MeterData, MeterdataRequest } from './model/models'

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
      const token = await this.getSessionInformation()
      this.xsrfToken = token ?? ''
      console.debug('Successfully authenticated against Netz OÖ Api')
  }

  public async getMeterData(
    meterDataRequest: MeterdataRequest
  ): Promise<MeterData | undefined> {
    return this.client
      .post(
        this.CONSUMPTION_ENDPOINT,
        meterDataRequest,
        {
          maxBodyLength: Infinity,
          headers: {
            'x-xsrf-token': this.xsrfToken
          }
        }
      )
      .then((response: AxiosResponse<MeterData[], any>) => {
        return response.data.shift()
      })
      .catch((error) => {
        console.error('An error occurred during fetching meter data', error.toJSON())
        return undefined
      })
  }

  async getDashboardView(): Promise<BusinessPartnerOverview> {
    return this.client
      .get(this.DASHBOARD_ENDPOINT, {
        headers: {
          'x-xsrf-token': this.xsrfToken
        }
      })
      .then((response: AxiosResponse<BusinessPartnerOverview, any>) => {
        return response.data
      })
      .catch((error) => {
        console.error('An error occurred during fetching dashboard data', error.toJSON())
        throw new Error('An error occurred during fetching dashboard data.')
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
    const result: string[] = []
    while (from <= to) {
      result.push(from.toISOString().slice(0, 10))
      from.setDate(from.getDate() + 1) //add one day to from-date
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
  public buildMeterdataRequest(date: string, contractAccountNumber: string, meterPointNumber: string, dimension = "ENERGY"): MeterdataRequest {
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
    return this.client.get('app/login')
      .catch((error) => {
        console.error('An error occurred during getting the login page', error.toJSON())
      })
  }

  private async performLogin() {
    return this.client.post('service/j_security_check', this.credentials)
      .catch((error) => {
        console.error('An error occurred during performing the login', error.toJSON())
        return undefined
      })
  }

  private async getSessionInformation() {
    const sessionRequest = await this.client.get(this.SESSION_ENDPOINT)
      .then(response => response)
      .catch((error) => {
        console.error('An error occurred during getting session information', error.toJSON())
        return undefined
      })
    if (sessionRequest == undefined) return undefined
    return this.extractXsrfToken(sessionRequest.headers)
  }

  private extractXsrfToken(headers: RawAxiosResponseHeaders) {
    const extractedSetCookieHeader = headers['set-cookie']!
    const regex = /XSRF-TOKEN=([^\s;]+)/
    for (const item of extractedSetCookieHeader) {
      const match = item.match(regex)
      if (match) {
        return match[1]
      }
    }
    throw new Error("No XSRF token found.")
  }

}
