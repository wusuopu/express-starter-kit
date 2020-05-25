import supertest from 'supertest';
import cookieJar from 'cookiejar';
import methods from 'methods'

export default {
  async login(request: supertest.SuperTest<supertest.Test>, email: string, password: string): Promise<supertest.SuperTest<supertest.Test>> {
    let res = await request
      .post('/api/v1/users/login')
      .send({email, password})
    if (res.status !== 200) {
      throw new Error(`login status: ${res.status}`)
    }
    let cookies = []
    for (let c of res.header['set-cookie']) {
      let cookie = new cookieJar.Cookie(c)
      cookies.push(`${cookie.name}=${cookie.value}`)
    }
    let reqCookie = cookies.join(';')
    for (let m of methods) {
      let oldMethod = request[m]
      request[m] = (url: string) => {
        return oldMethod(url)
          .set('Cookie', reqCookie)
      }
    }

    return request
  }
}
