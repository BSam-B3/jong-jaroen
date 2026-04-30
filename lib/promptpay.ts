import { crc16ccitt } from 'crc';
const f = (id: string, v: string) => id + v.length.toString().padStart(2,'0') + v;
export function buildPromptPayPayload(targetId: string, amount: number, ref1: string) {
  const id = targetId.replace(/\D/g,'');
  const acc = id.length === 13
    ? f('02', id)
    : f('01', ('0000000000000' + id).slice(-13));
  const merchant = f('29', f('00','A000000677010111') + acc);
  const addl = f('62', f('05', ref1));
  const body =
    f('00','01') + f('01','12') + merchant +
    f('52','0000') + f('53','764') + f('54', amount.toFixed(2)) +
    f('58','TH') + addl + '6304';
  const checksum = crc16ccitt(Buffer.from(body)).toString(16).toUpperCase().padStart(4,'0');
  return body + checksum;
}
export const makeRef1 = (txId: string) =>
  txId.replace(/-/g,'').slice(0,12).toUpperCase();
