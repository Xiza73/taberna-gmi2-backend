import { Carrier } from '../enums/carrier.enum';

export const TRACKING_URL_GENERATOR = Symbol('TRACKING_URL_GENERATOR');

const CARRIER_TEMPLATES: Record<string, string> = {
  [Carrier.SHALOM]: 'https://www.shalom.com.pe/tracking/{trackingNumber}',
  [Carrier.SERPOST]:
    'https://tracking.serpost.com.pe/tracking/{trackingNumber}',
  [Carrier.OLVA]: 'https://www.olvacourier.com/rastreo/{trackingNumber}',
  [Carrier.DHL]:
    'https://www.dhl.com/pe-es/home/rastreo.html?tracking-id={trackingNumber}',
};

export class TrackingUrlGenerator {
  generate(
    carrier: Carrier,
    trackingNumber: string,
    customUrl?: string,
  ): string {
    if (carrier === Carrier.OTHER) {
      return customUrl ?? '';
    }
    const template = CARRIER_TEMPLATES[carrier];
    return template.replace('{trackingNumber}', trackingNumber);
  }
}
