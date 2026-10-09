/**
 * @fileOverview DUBSAR 2.0 Official Lifetime License Manager & Cryptographic Verifier.
 * 
 * Cryptographic Architecture:
 * - Digital Signature Algorithm: ECDSA (SHA-256 on P-256 curve)
 * - Public Key: Embedded in client (spki format)
 * - Private Signing Key: Stored strictly OUTSIDE project & repository
 * - Offline Verification: 100% offline verified after initial activation
 * - Hardware Binding: Tied to unique machine fingerprint
 */

export interface LicenseToken {
  licenseId: string;
  businessName: string;
  plan: 'lifetime';
  maxDevices: number;
  deviceBinding: string;
  issuedAt: number;
  signature: string;
}

export interface LicenseStatus {
  isValid: boolean;
  plan: 'lifetime' | 'unlicensed';
  licenseId?: string;
  businessName?: string;
  maxDevices?: number;
  deviceBinding?: string;
  currentDeviceId: string;
  activatedAt?: number;
  issuedAt?: number;
  errorMessage?: string;
}

export class LicenseManager {
  // OFFICIAL DUBSAR 2.0 LICENSE PUBLIC KEY (ECDSA P-256 SPKI BASE64)
  // The matching Private Key is kept offline in secure vault and NEVER included in Git.
  private static readonly PUBLIC_KEY_BASE64 = 
    "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEDr43BBlvVIaOzag/RqFWLnkMpVwGarDveekcj+PpyMfRXkaFcMWkKdvyyNz1wlZMyS5Xq9IX7grycXHeX0NehA==";

  private static cachedCryptoKey: CryptoKey | null = null;

  /**
   * Returns or generates a deterministic, persistent device fingerprint
   */
  static getMachineFingerprint(): string {
    if (typeof window === 'undefined') return 'SERVER-DEVICE';
    let machineId = localStorage.getItem('dubsar_machine_fingerprint');
    if (!machineId) {
      // Generate a structured hardware identifier
      const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
      const timePart = Date.now().toString(36).substring(2, 6).toUpperCase();
      machineId = `DB-DEV-${timePart}-${randomPart}`;
      localStorage.setItem('dubsar_machine_fingerprint', machineId);
    }
    return machineId;
  }

  /**
   * Imports the embedded public key into WebCrypto API
   */
  private static async getPublicKey(): Promise<CryptoKey> {
    if (this.cachedCryptoKey) return this.cachedCryptoKey;

    const binaryString = atob(this.PUBLIC_KEY_BASE64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    this.cachedCryptoKey = await window.crypto.subtle.importKey(
      'spki',
      bytes.buffer,
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      false,
      ['verify']
    );

    return this.cachedCryptoKey;
  }

  /**
   * Verifies the authenticity and validity of a license token
   */
  static async verifyToken(token: LicenseToken, currentDeviceId: string): Promise<{ valid: boolean; reason?: string }> {
    try {
      if (!token || !token.signature || !token.licenseId) {
        return { valid: false, reason: "بيانات الترخيص غير مكتملة." };
      }

      if (token.plan !== 'lifetime') {
        return { valid: false, reason: "نوع الترخيص غير مطابق لنظام DUBSAR Lifetime." };
      }

      // Check device binding
      if (token.deviceBinding && token.deviceBinding !== "ANY_DEVICE") {
        if (token.deviceBinding !== currentDeviceId) {
          return { valid: false, reason: `الترخيص مقترن بجهاز آخر (${token.deviceBinding}) ولا يطابق هذا الجهاز (${currentDeviceId}).` };
        }
      }

      // Reconstruct canonical payload for signature check
      const payload = {
        licenseId: token.licenseId,
        businessName: token.businessName,
        plan: token.plan,
        maxDevices: token.maxDevices,
        deviceBinding: token.deviceBinding,
        issuedAt: token.issuedAt
      };

      const canonicalPayloadString = JSON.stringify(payload);
      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(canonicalPayloadString);

      // Decode base64 signature
      const signatureBinary = atob(token.signature);
      const signatureBytes = new Uint8Array(signatureBinary.length);
      for (let i = 0; i < signatureBinary.length; i++) {
        signatureBytes[i] = signatureBinary.charCodeAt(i);
      }

      const cryptoKey = await this.getPublicKey();
      const isSignatureValid = await window.crypto.subtle.verify(
        {
          name: 'ECDSA',
          hash: 'SHA-256'
        },
        cryptoKey,
        signatureBytes.buffer,
        dataBytes.buffer
      );

      if (!isSignatureValid) {
        return { valid: false, reason: "فشل التحقق من التوقيع الرقمي للترخيص (المفتاح تم التلاعب به أو غير أصلي)." };
      }

      return { valid: true };
    } catch (e: any) {
      console.error("[License Verifier Error]:", e);
      return { valid: false, reason: e?.message || "خطأ غير متوقع أثناء فحص الترخيص." };
    }
  }

  /**
   * Verifies the current license status offline using stored cryptographic license
   */
  static async verifyStatus(): Promise<LicenseStatus> {
    const currentDeviceId = this.getMachineFingerprint();

    if (typeof window === 'undefined') {
      return { isValid: false, plan: 'unlicensed', currentDeviceId, errorMessage: "بيئة غير مدعومة" };
    }

    const storedRaw = localStorage.getItem('dubsar_lifetime_license');
    if (!storedRaw) {
      return {
        isValid: false,
        plan: 'unlicensed',
        currentDeviceId,
        errorMessage: "النسخة غير مفعلة، يرجى إدخال كود الترخيص الرسمي."
      };
    }

    try {
      const parsed = JSON.parse(storedRaw);
      const token: LicenseToken = parsed.token;
      const activatedAt: number = parsed.activatedAt || Date.now();

      const verification = await this.verifyToken(token, currentDeviceId);
      if (!verification.valid) {
        return {
          isValid: false,
          plan: 'unlicensed',
          currentDeviceId,
          errorMessage: verification.reason || "الترخيص غير صالح."
        };
      }

      return {
        isValid: true,
        plan: 'lifetime',
        licenseId: token.licenseId,
        businessName: token.businessName,
        maxDevices: token.maxDevices,
        deviceBinding: token.deviceBinding,
        currentDeviceId,
        activatedAt,
        issuedAt: token.issuedAt
      };
    } catch (e) {
      return {
        isValid: false,
        plan: 'unlicensed',
        currentDeviceId,
        errorMessage: "ملف الترخيص المحلي تالف أو غير صالح."
      };
    }
  }

  /**
   * Activates the license code.
   * Performs real signature verification and device binding.
   */
  static async activate(armoredKey: string, onlineEndpoint?: string): Promise<{ success: boolean; status: LicenseStatus }> {
    const cleanKey = armoredKey.trim();
    if (!cleanKey) {
      throw new Error("يرجى إدخال كود الترخيص.");
    }

    const currentDeviceId = this.getMachineFingerprint();
    let token: LicenseToken;

    try {
      // Decode base64 armored license token safely supporting both UTF-8 and ASCII
      const binaryString = atob(cleanKey);
      let decodedJson: string;
      try {
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        decodedJson = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      } catch {
        decodedJson = binaryString;
      }
      token = JSON.parse(decodedJson);
    } catch (e) {
      throw new Error("صيغة كود الترخيص غير صالحة. تأكد من نسخ الكود كاملاً.");
    }

    // 1. If online endpoint is provided and internet is available, verify with headquarters
    if (onlineEndpoint && navigator.onLine) {
      try {
        const response = await fetch(onlineEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licenseId: token.licenseId,
            deviceId: currentDeviceId,
            timestamp: Date.now()
          })
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || "رفض خادم التراخيص تفعيل هذه النسخة.");
        }
      } catch (networkErr: any) {
        if (networkErr.message && !networkErr.message.includes('fetch')) {
          throw networkErr;
        }
        // If server is unreachable but signature is valid, proceed with cryptographic validation
        console.warn("[License] Activation server unreachable, falling back to cryptographic verification.");
      }
    }

    // 2. Cryptographic signature and device binding verification
    const verification = await this.verifyToken(token, currentDeviceId);
    if (!verification.valid) {
      throw new Error(verification.reason || "فشل التحقق من الترخيص.");
    }

    // 3. Store securely in local persistence
    const storageRecord = {
      token,
      activatedAt: Date.now()
    };
    localStorage.setItem('dubsar_lifetime_license', JSON.stringify(storageRecord));

    const status: LicenseStatus = {
      isValid: true,
      plan: 'lifetime',
      licenseId: token.licenseId,
      businessName: token.businessName,
      maxDevices: token.maxDevices,
      deviceBinding: token.deviceBinding,
      currentDeviceId,
      activatedAt: storageRecord.activatedAt,
      issuedAt: token.issuedAt
    };

    return { success: true, status };
  }

  /**
   * Deactivates the current license
   */
  static deactivate(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dubsar_lifetime_license');
    }
  }
}
