const axios = require('axios');
const admin = require('firebase-admin');

const db = admin.firestore();

class SAPOShippingService {
  constructor() {
    // Environment configuration
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // API URLs
    this.baseUrls = {
      test: {
        tracking: 'http://apitst.postoffice.co.za:443',
        import: 'http://apitst.postoffice.co.za:8084',
        trace: 'http://apitst.postoffice.co.za:8084'
      },
      production: {
        tracking: 'https://apiprod.postoffice.co.za:8080',
        import: 'https://apiprod.postoffice.co.za:8080',
        trace: 'https://apiprod.postoffice.co.za:8080'
      }
    };

    // Get current environment URLs
    const env = this.isProduction ? 'production' : 'test';
    this.urls = this.baseUrls[env];

    // API Token (should be in environment variables)
    this.token = process.env.SAPO_API_TOKEN || '440ba5a2-8b80-4d4c-8903-eb60f3e170da';
    
    // Client configuration (provided by SAPO)
    this.config = {
      officeCd: process.env.SAPO_OFFICE_CD || 'QUICKSELL',
      userFID: process.env.SAPO_USER_FID || 'QUICKSELL',
      operatorCd: 'ZAA',
      origCountryCd: 'ZA',
      destCountryCd: 'ZA'
    };

    // Event codes mapping
    this.eventCodes = {
      RECEIVED: '78',        // Item received from customer
      CANCELLED: '15',       // Cancel item
      AT_DELIVERY: '32',     // Received at delivery office
      DELIVERY_FAILED: '36', // Unsuccessful delivery attempt
      DELIVERED: '37',       // Final delivery
      HANDOVER: '39',        // Handover to delivery
      AT_SORTING: '71',      // Received at sorting center
      ON_HOLD: '73'         // Hold item at delivery office
    };
  }

  /**
   * Generate SAPO tracking number
   * @param {string} customerRef - Customer reference number
   * @returns {Promise<Object>} Tracking number response
   */
  async generateTrackingNumber(customerRef) {
    try {
      const url = `${this.urls.tracking}/api/trn-manager/gen`;
      
      const response = await axios.post(url, {
        cust_ref: customerRef
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        }
      });

      return {
        success: true,
        customerRef: response.data.cust_ref_num,
        trackingNumber: response.data.sapo_ref_num
      };
    } catch (error) {
      console.error('Error generating tracking number:', error.response?.data || error.message);
      throw new Error('Failed to generate tracking number');
    }
  }

  /**
   * Submit mail item to SAPO
   * @param {Object} itemData - Complete item data including sender, recipient, and parcel info
   * @returns {Promise<Object>} Submission response
   */
  async submitMailItem(itemData) {
    try {
      const url = `${this.urls.import}/IPSAPIService/ImportService.svc/rest/Mailitem?token=${this.token}`;
      
      // Prepare the payload according to SAPO specification
      const payload = {
        ItemId: itemData.trackingNumber,
        LocalId: itemData.trackingNumber,
        ItemWeight: String(itemData.weight || '1.000'),
        Value: itemData.value || 100,
        CurrencyCd: 'ZAR',
        DutiableInd: '100',
        DutiableValue: String(itemData.value * 0.15), // 15% customs
        CustomNo: itemData.orderNumber || 'QUICKSELL',
        ClassCd: 'C',
        Content: 'M', // Merchandise
        OperatorCd: this.config.operatorCd,
        OrigCountryCd: this.config.origCountryCd,
        DestCountryCd: this.config.destCountryCd,
        PostalStatusFcd: 'MINL',
        PostagePaidCurrencyCd: 'ZAR',
        PostagePaidValue: String(itemData.shippingCost || '50'),
        AdditionalFeesCurrencyCd: 'ZAR',
        AdditionalFeesValue: '0',
        NetworkEntryLocationTypeCd: '3',
        Parcel: {
          ConveyanceTypeCd: 'P',
          MailCategoryCd: 'A',
          MailItemCategoryCd: 'FC',
          RouteInstructionCd: 'BA',
          SenderInstructionCd: 'AB',
          InsuredValue: String(itemData.insuredValue || '0'),
          InsuredCurrencyCd: 'ZAR',
          InsuredSDRValue: String(itemData.insuredValue || '0'),
          ReturnDelay: '30',
          ExpressInd: itemData.express ? '1' : '0',
          CoDInd: '0',
          CoDValue: '0',
          CoDCurrencyCd: 'ZAR',
          DeliveryProofInd: '1',
          ExemptInd: '0',
          LetterCharacteristicCd: 'AL'
        },
        Addressee: {
          Name: itemData.recipient.name,
          Forename: itemData.recipient.firstName || '',
          Address: itemData.recipient.address,
          City: itemData.recipient.city,
          Postcode: itemData.recipient.postalCode,
          Country: 'ZA',
          Title: 'MS',
          PhoneNo: itemData.recipient.phone,
          Email: itemData.recipient.email
        },
        Sender: {
          Name: itemData.sender.name,
          Forename: itemData.sender.firstName || '',
          Address: itemData.sender.address,
          City: itemData.sender.city,
          Postcode: itemData.sender.postalCode,
          Country: 'ZA',
          Title: 'MS',
          PhoneNo: itemData.sender.phone,
          Email: itemData.sender.email
        },
        ItemEvents: [
          {
            TNCd: this.eventCodes.RECEIVED,
            Date: new Date().toISOString(),
            OfficeCd: this.config.officeCd,
            UserFID: this.config.userFID,
            ConditionCd: '30'
          }
        ]
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error submitting mail item:', error.response?.data || error.message);
      throw new Error('Failed to submit mail item');
    }
  }

  /**
   * Update mail item with new event
   * @param {string} trackingNumber - SAPO tracking number
   * @param {string} eventCode - Event code to post
   * @param {Object} additionalData - Additional event data
   * @returns {Promise<Object>} Update response
   */
  async updateMailItemEvent(trackingNumber, eventCode, additionalData = {}) {
    try {
      const url = `${this.urls.import}/IPSAPIService/ImportService.svc/rest/Mailitem?token=${this.token}`;
      
      const payload = {
        ItemId: trackingNumber,
        ClassCd: 'C',
        Content: 'M',
        OperatorCd: this.config.operatorCd,
        OrigCountryCd: this.config.origCountryCd,
        DestCountryCd: this.config.destCountryCd,
        PostalStatusFcd: eventCode === this.eventCodes.CANCELLED ? 'MIRT' : 'MINL',
        ItemEvents: [
          {
            TNCd: eventCode,
            Date: new Date().toISOString(),
            OfficeCd: this.config.officeCd,
            UserFID: this.config.userFID,
            ConditionCd: '30',
            ...additionalData
          }
        ]
      };

      // Add non-delivery reason for cancellation
      if (eventCode === this.eventCodes.CANCELLED) {
        payload.ItemEvents[0].NonDeliveryReason = '58';
        payload.ItemEvents[0].NonDeliveryMeasure = 'E';
      }

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error updating mail item:', error.response?.data || error.message);
      throw new Error('Failed to update mail item');
    }
  }

  /**
   * Track mail items
   * @param {string|Array} trackingNumbers - Single or multiple tracking numbers
   * @returns {Promise<Object>} Tracking information
   */
  async trackItems(trackingNumbers) {
    try {
      const ids = Array.isArray(trackingNumbers) ? trackingNumbers.join(',') : trackingNumbers;
      const url = `${this.urls.trace}/IPSAPIService/TrackAndTraceService.svc/rest/Mailitems`;
      
      const response = await axios.get(url, {
        params: {
          ids: ids,
          lang: 'EN',
          token: this.token
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Check for errors in response
      if (response.data.Errors && response.data.Errors.length > 0) {
        throw new Error(response.data.Errors[0]);
      }

      // Process and format tracking results
      const results = response.data.Results || [];
      const formattedResults = results.map(result => this.formatTrackingResult(result));

      return {
        success: true,
        items: formattedResults
      };
    } catch (error) {
      console.error('Error tracking items:', error.response?.data || error.message);
      throw new Error('Failed to track items');
    }
  }

  /**
   * Format tracking result for easier consumption
   * @param {Object} result - Raw tracking result from SAPO
   * @returns {Object} Formatted tracking information
   */
  formatTrackingResult(result) {
    const operationalItems = result.OperationalMailitems || [];
    const firstItem = operationalItems[0] || {};
    
    const events = firstItem.Events || [];
    const formattedEvents = events.map(event => ({
      code: event.IPSEventType?.Code,
      description: event.IPSEventType?.Name,
      office: event.EventOffice?.Name,
      officeCode: event.EventOffice?.Code,
      timestamp: event.LocalDateTime,
      status: this.mapEventCodeToStatus(event.IPSEventType?.Code)
    }));

    return {
      trackingNumber: result.Fid,
      weight: firstItem.Weight,
      origin: {
        country: firstItem.OrigCountry?.Name,
        code: firstItem.OrigCountry?.Code
      },
      destination: {
        country: firstItem.DestCountry?.Name,
        code: firstItem.DestCountry?.Code
      },
      characteristics: {
        express: firstItem.Characteristics?.ExpressIndicator || false,
        exempt: firstItem.Characteristics?.ExemptIndicator || false,
        insured: {
          amount: firstItem.Characteristics?.InsuredMoney?.Amount || 0,
          currency: firstItem.Characteristics?.InsuredMoney?.Currency || 'ZAR'
        }
      },
      events: formattedEvents,
      currentStatus: this.determineCurrentStatus(formattedEvents),
      lastUpdate: formattedEvents[0]?.timestamp || null
    };
  }

  /**
   * Map event code to customer-friendly status
   * @param {string} eventCode - SAPO event code
   * @returns {string} Customer status
   */
  mapEventCodeToStatus(eventCode) {
    const statusMap = {
      '78': 'Order Shipped',
      '15': 'Order Cancelled',
      '32': 'At Delivery Hub',
      '36': 'Delivery Attempted',
      '37': 'Delivered',
      '39': 'Out for Delivery',
      '71': 'In Transit',
      '73': 'On Hold'
    };
    return statusMap[eventCode] || 'Processing';
  }

  /**
   * Determine current status from events history
   * @param {Array} events - Array of tracking events
   * @returns {string} Current status
   */
  determineCurrentStatus(events) {
    if (events.length === 0) return 'Pending';
    
    // Get the most recent event
    const latestEvent = events[0];
    return latestEvent.status;
  }

  /**
   * Cancel a shipment
   * @param {string} trackingNumber - SAPO tracking number
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation response
   */
  async cancelShipment(trackingNumber, reason = 'Customer request') {
    return this.updateMailItemEvent(trackingNumber, this.eventCodes.CANCELLED, {
      NonDeliveryReason: '58',
      NonDeliveryMeasure: 'E',
      Note: reason
    });
  }

  /**
   * Mark item as delivered
   * @param {string} trackingNumber - SAPO tracking number
   * @param {string} signature - Recipient signature/name
   * @returns {Promise<Object>} Delivery confirmation response
   */
  async markAsDelivered(trackingNumber, signature) {
    return this.updateMailItemEvent(trackingNumber, this.eventCodes.DELIVERED, {
      SignatoryNm: signature,
      DelivLocation: this.config.officeCd
    });
  }

  /**
   * Create shipment for an order
   * @param {Object} order - Order data from database
   * @returns {Promise<Object>} Complete shipment creation response
   */
  async createShipmentForOrder(order) {
    try {
      // Generate tracking number
      const trackingResponse = await this.generateTrackingNumber(order.id);
      
      // Prepare shipment data
      const shipmentData = {
        trackingNumber: trackingResponse.trackingNumber,
        orderNumber: order.id,
        weight: order.weight || 1,
        value: order.amount,
        shippingCost: order.shippingCost || 50,
        insuredValue: order.insuredValue || 0,
        express: order.express || false,
        sender: {
          name: 'Quicksell Marketplace',
          firstName: 'Quicksell',
          address: order.seller?.address || '123 Main Street',
          city: order.seller?.city || 'Johannesburg',
          postalCode: order.seller?.postalCode || '2000',
          phone: order.seller?.phone || '0123456789',
          email: order.seller?.email || 'seller@quicksell.co.za'
        },
        recipient: {
          name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
          firstName: order.shippingAddress.firstName,
          address: order.shippingAddress.address,
          city: order.shippingAddress.city,
          postalCode: order.shippingAddress.postalCode,
          phone: order.shippingAddress.phone,
          email: order.shippingAddress.email
        }
      };

      // Submit to SAPO
      const submitResponse = await this.submitMailItem(shipmentData);

      // Save tracking info to database
      await db.collection('shipments').doc(order.id).set({
        orderId: order.id,
        trackingNumber: trackingResponse.trackingNumber,
        customerRef: trackingResponse.customerRef,
        status: 'shipped',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        events: [{
          code: this.eventCodes.RECEIVED,
          status: 'Order Shipped',
          timestamp: new Date().toISOString(),
          office: this.config.officeCd
        }]
      });

      return {
        success: true,
        trackingNumber: trackingResponse.trackingNumber,
        customerRef: trackingResponse.customerRef,
        submitResponse: submitResponse
      };
    } catch (error) {
      console.error('Error creating shipment:', error);
      throw error;
    }
  }
}

module.exports = new SAPOShippingService();