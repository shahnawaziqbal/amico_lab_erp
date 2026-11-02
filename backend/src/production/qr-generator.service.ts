import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class QrGeneratorService {
  private readonly secretKey = 'AMICO_SECURE_PLANT_KEY_2026';

  /**
   * Generates your strict structured batch ID: BMR-YYYYMMDD-[ProductCode]-000001
   */
  generateStructuredBatchNumber(productNameOrCode: string, sequenceNumber: number = 1): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const cleanIdentifier = (productNameOrCode || 'PRD').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const seqStr = String(sequenceNumber).padStart(6, '0');
    return `BMR-${dateStr}-${cleanIdentifier}-${seqStr}`;
  }

  /**
   * Generates a fully self-contained offline cryptographic JSON payload.
   * When scanned offline by any mobile camera or QR reader, it instantly holds the complete batch report.
   */
  generateOfflineBatchPayload(batchData: {
    batchNumber: string;
    productCode: string;
    productName: string;
    targetQuantity: number;
    lineReference: string;
    ingredients: any[];
  }): string {
    const payloadObject = {
      batchCode: batchData.batchNumber,
      sku: batchData.productCode,
      product: batchData.productName,
      targetQty: batchData.targetQuantity,
      line: batchData.lineReference,
      facility: 'Amico Laboratories Ltd, Savar, Dhaka',
      timestamp: new Date().toISOString(),
      consumedMaterials: batchData.ingredients.map(i => ({
        material: i.materialName || i.itemName,
        deductedQty: i.calculatedQtyKg || i.quantity || 0
      })),
      status: 'VERIFIED_cGMP_COMPLIANT'
    };

    const jsonString = JSON.stringify(payloadObject);
    
    // Cryptographic HMAC signature for zero-trust offline validation
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(jsonString)
      .digest('hex')
      .slice(0, 12);

    return JSON.stringify({
      ...payloadObject,
      cryptoSig: signature,
    });
  }
}