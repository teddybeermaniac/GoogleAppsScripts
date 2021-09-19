/*
 * Copyright © 2021 Michał Przybyś <michal@przybys.eu>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files ('the "Software"'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { Literal, Static, Union } from 'runtypes';

export const CurrencyRuntype = Union(
  Literal('AED'), Literal('AFN'), Literal('ALL'), Literal('AMD'), Literal('ANG'), Literal('AOA'),
  Literal('ARS'), Literal('AUD'), Literal('AWG'), Literal('AZN'), Literal('BAM'), Literal('BBD'),
  Literal('BDT'), Literal('BGN'), Literal('BHD'), Literal('BIF'), Literal('BMD'), Literal('BND'),
  Literal('BOB'), Literal('BRL'), Literal('BSD'), Literal('BTC'), Literal('BTN'), Literal('BWP'),
  Literal('BYN'), Literal('BZD'), Literal('CAD'), Literal('CDF'), Literal('CHF'), Literal('CLF'),
  Literal('CLP'), Literal('CNH'), Literal('CNY'), Literal('COP'), Literal('CRC'), Literal('CUC'),
  Literal('CUP'), Literal('CVE'), Literal('CZK'), Literal('DJF'), Literal('DKK'), Literal('DOP'),
  Literal('DZD'), Literal('EGP'), Literal('ERN'), Literal('ETB'), Literal('EUR'), Literal('FJD'),
  Literal('FKP'), Literal('FOK'), Literal('GBP'), Literal('GEL'), Literal('GGP'), Literal('GHS'),
  Literal('GIP'), Literal('GMD'), Literal('GNF'), Literal('GTQ'), Literal('GYD'), Literal('HKD'),
  Literal('HNL'), Literal('HRK'), Literal('HTG'), Literal('HUF'), Literal('IDR'), Literal('ILS'),
  Literal('IMP'), Literal('INR'), Literal('IQD'), Literal('IRR'), Literal('ISK'), Literal('JEP'),
  Literal('JMD'), Literal('JOD'), Literal('JPY'), Literal('KES'), Literal('KGS'), Literal('KHR'),
  Literal('KID'), Literal('KMF'), Literal('KPW'), Literal('KRW'), Literal('KWD'), Literal('KYD'),
  Literal('KZT'), Literal('LAK'), Literal('LBP'), Literal('LKR'), Literal('LRD'), Literal('LSL'),
  Literal('LYD'), Literal('MAD'), Literal('MDL'), Literal('MGA'), Literal('MKD'), Literal('MMK'),
  Literal('MNT'), Literal('MOP'), Literal('MRO'), Literal('MRU'), Literal('MUR'), Literal('MVR'),
  Literal('MWK'), Literal('MXN'), Literal('MYR'), Literal('MZN'), Literal('NAD'), Literal('NGN'),
  Literal('NIO'), Literal('NOK'), Literal('NPR'), Literal('NZD'), Literal('OMR'), Literal('PAB'),
  Literal('PEN'), Literal('PGK'), Literal('PHP'), Literal('PKR'), Literal('PLN'), Literal('PYG'),
  Literal('QAR'), Literal('RON'), Literal('RSD'), Literal('RUB'), Literal('RWF'), Literal('SAR'),
  Literal('SBD'), Literal('SCR'), Literal('SDG'), Literal('SEK'), Literal('SGD'), Literal('SHP'),
  Literal('SLL'), Literal('SOS'), Literal('SRD'), Literal('SSP'), Literal('STD'), Literal('STN'),
  Literal('SVC'), Literal('SYP'), Literal('SZL'), Literal('THB'), Literal('TJS'), Literal('TMT'),
  Literal('TND'), Literal('TOP'), Literal('TRY'), Literal('TTD'), Literal('TVD'), Literal('TWD'),
  Literal('TZS'), Literal('UAH'), Literal('UGX'), Literal('USD'), Literal('UYU'), Literal('UZS'),
  Literal('VEF'), Literal('VES'), Literal('VND'), Literal('VUV'), Literal('WST'), Literal('XAF'),
  Literal('XAG'), Literal('XAU'), Literal('XCD'), Literal('XDR'), Literal('XOF'), Literal('XPD'),
  Literal('XPF'), Literal('XPT'), Literal('YER'), Literal('ZAR'), Literal('ZMW'), Literal('ZWL'),
);

type Currency = Static<typeof CurrencyRuntype>;
export default Currency;
