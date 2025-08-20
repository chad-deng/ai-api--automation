import request from "supertest";

const baseURL = 'https://api.stripe.com/';
describe('v1 API Tests', () => {
    describe('GET /v1/account', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/account')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/account_links', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/account_links')
            .send({
              "account": "Generated Value",
              "collect": "eventually_due",
              "collection_options": {
                "fields": "eventually_due",
                "future_requirements": "include"
              },
              "refresh_url": "Sample Data",
              "type": "account_onboarding"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/account_links')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/account_sessions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/account_sessions')
            .send({
              "account": "Test String",
              "components": {
                "account_management": {
                  "enabled": false
                },
                "account_onboarding": {
                  "enabled": false,
                  "features": {
                    "disable_stripe_user_authentication": false
                  }
                },
                "disputes_list": {
                  "enabled": false,
                  "features": {
                    "capture_payments": true,
                    "dispute_management": true,
                    "refund_management": false
                  }
                },
                "documents": {
                  "enabled": true,
                  "features": {}
                },
                "financial_account_transactions": {
                  "enabled": false,
                  "features": {
                    "card_spend_dispute_management": true
                  }
                },
                "instant_payouts_promotion": {
                  "enabled": true,
                  "features": {
                    "disable_stripe_user_authentication": true,
                    "instant_payouts": false
                  }
                },
                "issuing_card": {
                  "enabled": false,
                  "features": {
                    "card_spend_dispute_management": false,
                    "cardholder_management": true,
                    "spend_control_management": true
                  }
                },
                "issuing_cards_list": {
                  "enabled": true
                },
                "notification_banner": {
                  "enabled": true,
                  "features": {
                    "disable_stripe_user_authentication": false
                  }
                },
                "payment_details": {
                  "enabled": false,
                  "features": {
                    "capture_payments": true,
                    "refund_management": true
                  }
                },
                "payment_disputes": {
                  "enabled": false,
                  "features": {
                    "destination_on_behalf_of_charge_management": false,
                    "dispute_management": true
                  }
                },
                "payments": {
                  "enabled": true,
                  "features": {
                    "capture_payments": false,
                    "destination_on_behalf_of_charge_management": true,
                    "refund_management": true
                  }
                },
                "payouts": {
                  "enabled": true,
                  "features": {
                    "disable_stripe_user_authentication": false,
                    "edit_payout_schedule": true,
                    "instant_payouts": false,
                    "standard_payouts": true
                  }
                },
                "payouts_list": {
                  "enabled": false,
                  "features": {}
                },
                "tax_registrations": {
                  "enabled": false,
                  "features": {}
                },
                "tax_settings": {
                  "enabled": false
                }
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/account_sessions')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/accounts', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/accounts')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/accounts', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts')
            .send({
              "account_token": "Test String",
              "business_type": "individual",
              "capabilities": {
                "afterpay_clearpay_payments": {
                  "requested": false
                },
                "alma_payments": {},
                "amazon_pay_payments": {},
                "bancontact_payments": {
                  "requested": false
                },
                "blik_payments": {
                  "requested": false
                },
                "boleto_payments": {
                  "requested": true
                },
                "card_issuing": {
                  "requested": true
                },
                "card_payments": {
                  "requested": false
                },
                "cashapp_payments": {},
                "crypto_payments": {
                  "requested": true
                },
                "eps_payments": {},
                "gb_bank_transfer_payments": {},
                "grabpay_payments": {},
                "ideal_payments": {
                  "requested": true
                },
                "jcb_payments": {},
                "kakao_pay_payments": {
                  "requested": false
                },
                "klarna_payments": {
                  "requested": true
                },
                "konbini_payments": {
                  "requested": true
                },
                "kr_card_payments": {
                  "requested": false
                },
                "link_payments": {
                  "requested": false
                },
                "multibanco_payments": {
                  "requested": true
                },
                "mx_bank_transfer_payments": {},
                "naver_pay_payments": {
                  "requested": false
                },
                "nz_bank_account_becs_debit_payments": {
                  "requested": true
                },
                "p24_payments": {},
                "pay_by_bank_payments": {
                  "requested": false
                },
                "payco_payments": {},
                "pix_payments": {
                  "requested": false
                },
                "promptpay_payments": {
                  "requested": true
                },
                "sepa_bank_transfer_payments": {
                  "requested": false
                },
                "sofort_payments": {
                  "requested": true
                },
                "tax_reporting_us_1099_k": {
                  "requested": false
                },
                "tax_reporting_us_1099_misc": {
                  "requested": true
                },
                "transfers": {
                  "requested": true
                },
                "treasury": {
                  "requested": false
                },
                "us_bank_account_ach_payments": {
                  "requested": false
                },
                "us_bank_transfer_payments": {
                  "requested": false
                }
              },
              "controller": {
                "fees": {
                  "payer": "account"
                },
                "losses": {},
                "requirement_collection": "stripe",
                "stripe_dashboard": {
                  "type": "full"
                }
              },
              "country": "Test String",
              "default_currency": "Test String",
              "documents": {
                "company_license": {
                  "files": [
                    "API Test Data"
                  ]
                },
                "company_registration_verification": {},
                "company_tax_id_verification": {
                  "files": [
                    "Test String",
                    "Test String"
                  ]
                },
                "proof_of_address": {},
                "proof_of_registration": {
                  "files": [
                    "Test String"
                  ]
                }
              },
              "email": "Sample Data",
              "expand": [
                "Generated Value",
                "Generated Value"
              ],
              "external_account": "Sample Data",
              "groups": {
                "payments_pricing": {
                  "id": 111,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.910Z"
                }
              },
              "individual": {
                "address_kana": {
                  "city": "API Test Data",
                  "country": "API Test Data",
                  "line1": "API Test Data",
                  "line2": "Sample Data",
                  "town": "Sample Data"
                },
                "dob": {
                  "id": 977,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.911Z"
                },
                "email": "Generated Value",
                "first_name_kana": "API Test Data",
                "first_name_kanji": "API Test Data",
                "id_number": "Sample Data",
                "id_number_secondary": "Generated Value",
                "last_name_kana": "Generated Value",
                "maiden_name": "Sample Data",
                "metadata": {
                  "id": 287,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.911Z"
                },
                "registered_address": {
                  "city": "Generated Value",
                  "country": "Generated Value",
                  "line1": "Sample Data",
                  "line2": "Generated Value"
                },
                "relationship": {
                  "director": true,
                  "executive": true,
                  "owner": true,
                  "title": "Generated Value"
                },
                "ssn_last_4": "Generated Value"
              },
              "metadata": {
                "id": 88,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.911Z"
              },
              "settings": {
                "branding": {
                  "primary_color": "Test String",
                  "secondary_color": "Generated Value"
                },
                "card_issuing": {},
                "invoices": {
                  "hosted_payment_method_save": "never"
                },
                "payments": {
                  "statement_descriptor_kana": "Sample Data"
                },
                "treasury": {
                  "tos_acceptance": {
                    "user_agent": {
                      "id": 494,
                      "name": "Generated Test Data",
                      "status": "active",
                      "createdAt": "2025-08-14T09:47:07.911Z"
                    }
                  }
                }
              },
              "tos_acceptance": {
                "date": 598,
                "ip": "Generated Value"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/accounts/{account}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/accounts/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/accounts/{account}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Generated Value')
            .send({
              "account_token": "Sample Data",
              "business_type": "non_profit",
              "company": {
                "address": {
                  "city": "API Test Data",
                  "country": "API Test Data",
                  "line1": "Sample Data",
                  "line2": "Sample Data",
                  "postal_code": "Test String"
                },
                "directorship_declaration": {
                  "date": 114,
                  "user_agent": "Sample Data"
                },
                "export_license_id": "Generated Value",
                "export_purpose_code": "API Test Data",
                "name": "Sample Data",
                "name_kana": "Sample Data",
                "name_kanji": "Test String",
                "owners_provided": true,
                "ownership_declaration": {
                  "date": 736,
                  "ip": "Sample Data",
                  "user_agent": "Generated Value"
                },
                "ownership_exemption_reason": "",
                "registration_number": "Generated Value",
                "structure": "public_corporation",
                "tax_id": "Test String",
                "tax_id_registrar": "Generated Value",
                "verification": {
                  "document": {
                    "back": "Test String"
                  }
                }
              },
              "default_currency": "Generated Value",
              "email": "Sample Data",
              "external_account": "API Test Data",
              "individual": {
                "address": {
                  "city": "Sample Data",
                  "country": "Generated Value",
                  "line1": "Test String",
                  "postal_code": "API Test Data",
                  "state": "API Test Data"
                },
                "address_kanji": {
                  "country": "Generated Value",
                  "line1": "Sample Data",
                  "postal_code": "API Test Data",
                  "state": "Sample Data",
                  "town": "API Test Data"
                },
                "dob": {
                  "id": 394,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.911Z"
                },
                "email": "Sample Data",
                "first_name": "Test String",
                "first_name_kana": "Sample Data",
                "first_name_kanji": "Sample Data",
                "gender": "Sample Data",
                "id_number_secondary": "API Test Data",
                "last_name": "Sample Data",
                "last_name_kanji": "Sample Data",
                "maiden_name": "API Test Data",
                "metadata": {
                  "id": 817,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.911Z"
                },
                "phone": "Test String",
                "political_exposure": "none",
                "verification": {
                  "additional_document": {
                    "back": "Generated Value",
                    "front": "Sample Data"
                  }
                }
              },
              "settings": {
                "bacs_debit_payments": {},
                "branding": {
                  "icon": "API Test Data",
                  "logo": "API Test Data",
                  "primary_color": "Sample Data",
                  "secondary_color": "Sample Data"
                },
                "card_issuing": {},
                "invoices": {
                  "default_account_tax_ids": {
                    "id": 86,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.911Z"
                  },
                  "hosted_payment_method_save": "offer"
                },
                "payments": {
                  "statement_descriptor": "Test String",
                  "statement_descriptor_kanji": "Sample Data"
                },
                "payouts": {
                  "debit_negative_balances": false,
                  "schedule": {
                    "delay_days": {
                      "id": 336,
                      "name": "Generated Test Data",
                      "status": "active",
                      "createdAt": "2025-08-14T09:47:07.911Z"
                    },
                    "monthly_anchor": 480,
                    "weekly_anchor": "tuesday",
                    "weekly_payout_days": [
                      "sunday"
                    ]
                  }
                }
              },
              "tos_acceptance": {
                "ip": "Generated Value",
                "service_agreement": "Sample Data",
                "user_agent": "Sample Data"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Generated Value')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/accounts/{account}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/accounts/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/accounts/{account}/bank_accounts', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Test String/bank_accounts')
            .send({
              "bank_account": {
                "id": 86,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.911Z"
              },
              "default_for_currency": true,
              "expand": [
                "Sample Data"
              ],
              "external_account": "API Test Data",
              "metadata": {}
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Test String/bank_accounts')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/accounts/{account}/bank_accounts/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/accounts/Sample Data/bank_accounts/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/accounts/{account}/bank_accounts/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Generated Value/bank_accounts/Test String')
            .send({
              "account_holder_type": "individual",
              "account_type": "checking",
              "address_city": "Sample Data",
              "address_line2": "API Test Data",
              "address_zip": "API Test Data",
              "documents": {
                "bank_account_ownership_verification": {}
              },
              "exp_month": "Test String",
              "exp_year": "API Test Data",
              "expand": [
                "Generated Value"
              ],
              "metadata": {
                "id": 637,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.912Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Generated Value/bank_accounts/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/accounts/{account}/bank_accounts/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/accounts/API Test Data/bank_accounts/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/accounts/{account}/capabilities', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/accounts/Generated Value/capabilities')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/accounts/{account}/capabilities/{capability}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/accounts/Test String/capabilities/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/accounts/{account}/capabilities/{capability}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Generated Value/capabilities/Generated Value')
            .send({
              "expand": [
                "Generated Value"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Generated Value/capabilities/Generated Value')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/accounts/{account}/external_accounts', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/accounts/Test String/external_accounts')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/accounts/{account}/external_accounts', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Sample Data/external_accounts')
            .send({
              "default_for_currency": false,
              "metadata": {}
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Sample Data/external_accounts')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/accounts/{account}/external_accounts/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/accounts/Sample Data/external_accounts/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/accounts/{account}/external_accounts/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/API Test Data/external_accounts/API Test Data')
            .send({
              "account_holder_name": "API Test Data",
              "address_city": "API Test Data",
              "address_country": "API Test Data",
              "address_line1": "Sample Data",
              "address_state": "API Test Data",
              "default_for_currency": false,
              "exp_month": "Generated Value",
              "exp_year": "Sample Data",
              "expand": [
                "Test String",
                "API Test Data",
                "Sample Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/API Test Data/external_accounts/API Test Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/accounts/{account}/external_accounts/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/accounts/Sample Data/external_accounts/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/accounts/{account}/login_links', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Sample Data/login_links')
            .send({
              "expand": [
                "Generated Value"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Sample Data/login_links')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/accounts/{account}/people', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/accounts/Test String/people')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/accounts/{account}/people', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Sample Data/people')
            .send({
              "additional_tos_acceptances": {},
              "address": {
                "city": "Sample Data",
                "postal_code": "API Test Data",
                "state": "Test String"
              },
              "address_kanji": {
                "city": "Sample Data",
                "line1": "Generated Value",
                "line2": "API Test Data"
              },
              "dob": {
                "id": 947,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.912Z"
              },
              "expand": [
                "Sample Data"
              ],
              "first_name_kanji": "Test String",
              "full_name_aliases": {
                "id": 607,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.912Z"
              },
              "gender": "Generated Value",
              "id_number": "API Test Data",
              "id_number_secondary": "API Test Data",
              "last_name": "Generated Value",
              "last_name_kanji": "API Test Data",
              "maiden_name": "Sample Data",
              "nationality": "Test String",
              "person_token": "Sample Data",
              "phone": "Test String",
              "political_exposure": "existing",
              "registered_address": {
                "country": "Generated Value",
                "line2": "Test String",
                "state": "Generated Value"
              },
              "ssn_last_4": "Sample Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Sample Data/people')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/accounts/{account}/people/{person}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/accounts/API Test Data/people/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/accounts/{account}/people/{person}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Test String/people/Test String')
            .send({
              "address_kana": {
                "country": "Sample Data",
                "line1": "Generated Value",
                "line2": "Test String",
                "town": "API Test Data"
              },
              "address_kanji": {
                "city": "Sample Data",
                "country": "Sample Data",
                "line1": "API Test Data",
                "line2": "Test String",
                "postal_code": "Sample Data"
              },
              "dob": {
                "id": 730,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.912Z"
              },
              "email": "Generated Value",
              "first_name": "Generated Value",
              "first_name_kanji": "API Test Data",
              "gender": "Generated Value",
              "id_number_secondary": "Generated Value",
              "last_name_kana": "Test String",
              "last_name_kanji": "Generated Value",
              "maiden_name": "Test String",
              "metadata": {
                "id": 64,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.912Z"
              },
              "nationality": "API Test Data",
              "phone": "Sample Data",
              "political_exposure": "existing",
              "registered_address": {
                "postal_code": "Sample Data",
                "state": "API Test Data"
              },
              "relationship": {
                "authorizer": true,
                "executive": true,
                "legal_guardian": false,
                "owner": false,
                "percent_ownership": {
                  "id": 69,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.912Z"
                },
                "title": "Sample Data"
              },
              "us_cfpb_data": {
                "ethnicity_details": {}
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Test String/people/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/accounts/{account}/people/{person}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/accounts/Generated Value/people/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/accounts/{account}/persons', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/accounts/Generated Value/persons')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/accounts/{account}/persons', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Generated Value/persons')
            .send({
              "address": {
                "city": "API Test Data",
                "country": "Generated Value",
                "line1": "Test String",
                "postal_code": "Sample Data",
                "state": "Sample Data"
              },
              "address_kana": {
                "city": "Sample Data",
                "country": "Generated Value",
                "line1": "Test String",
                "line2": "Generated Value",
                "postal_code": "Generated Value",
                "state": "Generated Value",
                "town": "Sample Data"
              },
              "address_kanji": {
                "city": "Sample Data",
                "line1": "Sample Data",
                "line2": "Sample Data",
                "postal_code": "Test String",
                "state": "Sample Data",
                "town": "API Test Data"
              },
              "dob": {
                "id": 619,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.912Z"
              },
              "documents": {
                "company_authorization": {},
                "passport": {
                  "files": [
                    {
                      "id": 855,
                      "name": "Generated Test Data",
                      "status": "active",
                      "createdAt": "2025-08-14T09:47:07.912Z"
                    },
                    {
                      "id": 201,
                      "name": "Generated Test Data",
                      "status": "active",
                      "createdAt": "2025-08-14T09:47:07.912Z"
                    },
                    {
                      "id": 85,
                      "name": "Generated Test Data",
                      "status": "active",
                      "createdAt": "2025-08-14T09:47:07.912Z"
                    }
                  ]
                },
                "visa": {
                  "files": [
                    {
                      "id": 93,
                      "name": "Generated Test Data",
                      "status": "active",
                      "createdAt": "2025-08-14T09:47:07.912Z"
                    }
                  ]
                }
              },
              "email": "Test String",
              "first_name_kana": "Sample Data",
              "full_name_aliases": {
                "id": 606,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.912Z"
              },
              "id_number": "Test String",
              "id_number_secondary": "API Test Data",
              "last_name": "API Test Data",
              "last_name_kana": "Sample Data",
              "last_name_kanji": "Generated Value",
              "maiden_name": "Generated Value",
              "metadata": {
                "id": 514,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.912Z"
              },
              "nationality": "Test String",
              "person_token": "Test String",
              "phone": "Generated Value",
              "political_exposure": "existing",
              "registered_address": {
                "city": "Test String",
                "line1": "Generated Value",
                "line2": "Test String",
                "postal_code": "Sample Data",
                "state": "Test String"
              },
              "ssn_last_4": "Sample Data",
              "us_cfpb_data": {
                "ethnicity_details": {
                  "ethnicity_other": "Generated Value"
                },
                "race_details": {
                  "race_other": "Test String"
                }
              },
              "verification": {
                "additional_document": {
                  "back": "API Test Data"
                },
                "document": {
                  "front": "Test String"
                }
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Generated Value/persons')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/accounts/{account}/persons/{person}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/accounts/API Test Data/persons/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/accounts/{account}/persons/{person}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Sample Data/persons/Generated Value')
            .send({
              "address": {
                "country": "Generated Value",
                "line2": "Sample Data",
                "state": "API Test Data"
              },
              "address_kana": {
                "country": "Sample Data",
                "line1": "Sample Data",
                "postal_code": "Generated Value"
              },
              "address_kanji": {
                "country": "Generated Value",
                "line1": "Test String",
                "line2": "API Test Data"
              },
              "dob": {
                "id": 67,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.912Z"
              },
              "documents": {
                "passport": {
                  "files": [
                    {
                      "id": 525,
                      "name": "Generated Test Data",
                      "status": "active",
                      "createdAt": "2025-08-14T09:47:07.912Z"
                    }
                  ]
                },
                "visa": {
                  "files": [
                    {
                      "id": 645,
                      "name": "Generated Test Data",
                      "status": "active",
                      "createdAt": "2025-08-14T09:47:07.912Z"
                    }
                  ]
                }
              },
              "expand": [
                "Sample Data"
              ],
              "first_name": "Test String",
              "full_name_aliases": {
                "id": 509,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.912Z"
              },
              "gender": "Sample Data",
              "id_number": "Test String",
              "id_number_secondary": "Test String",
              "last_name": "API Test Data",
              "last_name_kana": "Sample Data",
              "last_name_kanji": "Sample Data",
              "person_token": "Test String",
              "political_exposure": "existing",
              "registered_address": {
                "city": "API Test Data",
                "country": "Sample Data",
                "line1": "Generated Value",
                "line2": "Sample Data"
              },
              "us_cfpb_data": {
                "ethnicity_details": {},
                "self_identified_gender": "API Test Data"
              },
              "verification": {
                "additional_document": {
                  "back": "Test String"
                }
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Sample Data/persons/Generated Value')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/accounts/{account}/persons/{person}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/accounts/Sample Data/persons/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/accounts/{account}/reject', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Generated Value/reject')
            .send({
              "reason": "Test String"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/accounts/Generated Value/reject')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/apple_pay/domains', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/apple_pay/domains')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/apple_pay/domains', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/apple_pay/domains')
            .send({
              "domain_name": "API Test Data",
              "expand": [
                "Test String",
                "Test String",
                "API Test Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/apple_pay/domains')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/apple_pay/domains/{domain}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/apple_pay/domains/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('DELETE /v1/apple_pay/domains/{domain}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/apple_pay/domains/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/application_fees', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/application_fees')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/application_fees/{fee}/refunds/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/application_fees/Sample Data/refunds/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/application_fees/{fee}/refunds/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/application_fees/Generated Value/refunds/Sample Data')
            .send({
              "expand": [
                "Test String",
                "Test String",
                "Generated Value"
              ],
              "metadata": {
                "id": 3,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.912Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/application_fees/Generated Value/refunds/Sample Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/application_fees/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/application_fees/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/application_fees/{id}/refund', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/application_fees/Test String/refund')
            .send({
              "amount": 324,
              "expand": [
                "Generated Value"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/application_fees/Test String/refund')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/application_fees/{id}/refunds', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/application_fees/Generated Value/refunds')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/application_fees/{id}/refunds', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/application_fees/API Test Data/refunds')
            .send({
              "amount": 433,
              "metadata": {}
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/application_fees/API Test Data/refunds')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/apps/secrets', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/apps/secrets')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/apps/secrets', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/apps/secrets')
            .send({
              "expand": [
                "API Test Data"
              ],
              "name": "Generated Value",
              "payload": "Test String",
              "scope": {
                "type": "account",
                "user": "API Test Data"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/apps/secrets')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/apps/secrets/delete', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/apps/secrets/delete')
            .send({
              "expand": [
                "Sample Data",
                "Generated Value",
                "Generated Value"
              ],
              "name": "Test String",
              "scope": {
                "type": "user"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/apps/secrets/delete')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/apps/secrets/find', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/apps/secrets/find')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/balance', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/balance')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/balance/history', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/balance/history')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/balance/history/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/balance/history/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/balance_transactions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/balance_transactions')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/balance_transactions/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/balance_transactions/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/billing/alerts', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/billing/alerts')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/billing/alerts', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/alerts')
            .send({
              "alert_type": "usage_threshold",
              "title": "Sample Data",
              "usage_threshold": {
                "gte": 341,
                "meter": "Test String",
                "recurrence": "one_time"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/alerts')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/billing/alerts/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/billing/alerts/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/billing/alerts/{id}/activate', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/alerts/Test String/activate')
            .send({
              "expand": [
                "Generated Value",
                "Generated Value"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/alerts/Test String/activate')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/billing/alerts/{id}/archive', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/alerts/Generated Value/archive')
            .send({
              "expand": [
                "Sample Data",
                "Test String"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/alerts/Generated Value/archive')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/billing/alerts/{id}/deactivate', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/alerts/Sample Data/deactivate')
            .send({
              "expand": [
                "Generated Value",
                "API Test Data",
                "Generated Value"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/alerts/Sample Data/deactivate')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/billing/credit_balance_summary', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/billing/credit_balance_summary')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/billing/credit_balance_transactions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/billing/credit_balance_transactions')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/billing/credit_balance_transactions/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/billing/credit_balance_transactions/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/billing/credit_grants', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/billing/credit_grants')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/billing/credit_grants', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/credit_grants')
            .send({
              "amount": {
                "monetary": {
                  "currency": "API Test Data",
                  "value": 269
                },
                "type": "monetary"
              },
              "applicability_config": {
                "scope": {
                  "price_type": "metered",
                  "prices": [
                    {
                      "id": "Test String"
                    },
                    {
                      "id": "Generated Value"
                    },
                    {
                      "id": "Generated Value"
                    }
                  ]
                }
              },
              "category": "paid",
              "customer": "Generated Value",
              "expand": [
                "API Test Data",
                "Test String",
                "API Test Data"
              ],
              "expires_at": 275,
              "metadata": {},
              "name": "Sample Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/credit_grants')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/billing/credit_grants/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/billing/credit_grants/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/billing/credit_grants/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/credit_grants/Test String')
            .send({
              "expand": [
                "Generated Value",
                "Generated Value",
                "Generated Value"
              ],
              "metadata": {}
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/credit_grants/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/billing/credit_grants/{id}/expire', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/credit_grants/API Test Data/expire')
            .send({
              "expand": [
                "Generated Value"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/credit_grants/API Test Data/expire')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/billing/credit_grants/{id}/void', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/credit_grants/Sample Data/void')
            .send({})
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/credit_grants/Sample Data/void')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/billing/meter_event_adjustments', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/meter_event_adjustments')
            .send({
              "event_name": "Generated Value",
              "expand": [
                "Sample Data",
                "Sample Data",
                "Generated Value"
              ],
              "type": "cancel"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/meter_event_adjustments')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/billing/meter_events', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/meter_events')
            .send({
              "event_name": "Sample Data",
              "expand": [
                "Generated Value",
                "API Test Data",
                "Test String"
              ],
              "identifier": "Test String",
              "payload": {}
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/meter_events')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/billing/meters', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/billing/meters')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/billing/meters', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/meters')
            .send({
              "customer_mapping": {
                "event_payload_key": "Generated Value",
                "type": "by_id"
              },
              "default_aggregation": {
                "formula": "count"
              },
              "display_name": "Sample Data",
              "event_name": "Test String",
              "event_time_window": "hour",
              "expand": [
                "Sample Data",
                "Sample Data",
                "Sample Data"
              ],
              "value_settings": {
                "event_payload_key": "Generated Value"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/meters')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/billing/meters/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/billing/meters/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/billing/meters/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/meters/Sample Data')
            .send({
              "display_name": "Test String",
              "expand": [
                "Sample Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/meters/Sample Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/billing/meters/{id}/deactivate', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/meters/Generated Value/deactivate')
            .send({})
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/meters/Generated Value/deactivate')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/billing/meters/{id}/event_summaries', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/billing/meters/Sample Data/event_summaries')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/billing/meters/{id}/reactivate', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/meters/Test String/reactivate')
            .send({})
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/billing/meters/Test String/reactivate')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/billing_portal/configurations', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/billing_portal/configurations')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/billing_portal/configurations', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/billing_portal/configurations')
            .send({
              "business_profile": {
                "headline": {
                  "id": 590,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.913Z"
                },
                "privacy_policy_url": "Test String",
                "terms_of_service_url": "Sample Data"
              },
              "default_return_url": {
                "id": 299,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.913Z"
              },
              "expand": [
                "Sample Data",
                "Test String"
              ],
              "features": {
                "invoice_history": {
                  "enabled": false
                },
                "payment_method_update": {
                  "enabled": false
                },
                "subscription_cancel": {
                  "enabled": true,
                  "mode": "at_period_end",
                  "proration_behavior": "none"
                },
                "subscription_update": {
                  "enabled": true,
                  "products": {
                    "id": 485,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.913Z"
                  },
                  "proration_behavior": "create_prorations",
                  "schedule_at_period_end": {
                    "conditions": [
                      {
                        "type": "decreasing_item_amount"
                      },
                      {
                        "type": "shortening_interval"
                      },
                      {
                        "type": "shortening_interval"
                      }
                    ]
                  }
                }
              },
              "login_page": {
                "enabled": true
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/billing_portal/configurations')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/billing_portal/configurations/{configuration}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/billing_portal/configurations/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/billing_portal/configurations/{configuration}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/billing_portal/configurations/API Test Data')
            .send({
              "active": true,
              "expand": [
                "Sample Data"
              ],
              "features": {
                "customer_update": {
                  "enabled": true
                },
                "invoice_history": {
                  "enabled": true
                }
              },
              "login_page": {
                "enabled": false
              },
              "metadata": {
                "id": 869,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.913Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/billing_portal/configurations/API Test Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/billing_portal/sessions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/billing_portal/sessions')
            .send({
              "configuration": "Generated Value",
              "customer": "Generated Value",
              "expand": [
                "Sample Data"
              ],
              "locale": "it",
              "on_behalf_of": "Sample Data",
              "return_url": "API Test Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/billing_portal/sessions')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/charges', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/charges')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/charges', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/charges')
            .send({
              "amount": 676,
              "application_fee": 349,
              "application_fee_amount": 790,
              "capture": false,
              "card": {
                "id": 863,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.913Z"
              },
              "currency": "Sample Data",
              "customer": "Test String",
              "description": "Generated Value",
              "destination": {
                "id": 995,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.913Z"
              },
              "expand": [
                "Test String"
              ],
              "on_behalf_of": "Test String",
              "radar_options": {
                "session": "Test String"
              },
              "receipt_email": "API Test Data",
              "source": "Sample Data",
              "statement_descriptor": "Sample Data",
              "statement_descriptor_suffix": "Test String",
              "transfer_group": "Sample Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/charges')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/charges/search', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/charges/search')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/charges/{charge}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/charges/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/charges/{charge}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/charges/Generated Value')
            .send({
              "customer": "API Test Data",
              "description": "Generated Value",
              "expand": [
                "Test String",
                "Generated Value",
                "Test String"
              ],
              "metadata": {
                "id": 131,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.913Z"
              },
              "receipt_email": "Generated Value",
              "shipping": {
                "address": {
                  "country": "API Test Data"
                },
                "name": "Test String",
                "tracking_number": "Sample Data"
              },
              "transfer_group": "Generated Value"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/charges/Generated Value')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/charges/{charge}/capture', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/charges/Sample Data/capture')
            .send({
              "application_fee": 566,
              "application_fee_amount": 548,
              "expand": [
                "Test String",
                "Test String",
                "Sample Data"
              ],
              "statement_descriptor": "Test String",
              "statement_descriptor_suffix": "Generated Value",
              "transfer_group": "Generated Value"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/charges/Sample Data/capture')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/charges/{charge}/dispute', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/charges/Sample Data/dispute')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/charges/{charge}/dispute', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/charges/API Test Data/dispute')
            .send({
              "evidence": {
                "cancellation_policy": "Test String",
                "customer_communication": "API Test Data",
                "customer_purchase_ip": "API Test Data",
                "duplicate_charge_documentation": "API Test Data",
                "enhanced_evidence": {
                  "id": 373,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.913Z"
                },
                "product_description": "Test String",
                "receipt": "API Test Data",
                "refund_policy_disclosure": "Sample Data",
                "service_documentation": "Generated Value",
                "shipping_address": "Sample Data",
                "shipping_carrier": "Test String",
                "shipping_date": "Sample Data",
                "shipping_documentation": "Test String",
                "uncategorized_file": "Test String",
                "uncategorized_text": "API Test Data"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/charges/API Test Data/dispute')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/charges/{charge}/dispute/close', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/charges/Test String/dispute/close')
            .send({})
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/charges/Test String/dispute/close')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/charges/{charge}/refund', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/charges/API Test Data/refund')
            .send({
              "amount": 294,
              "expand": [
                "Test String"
              ],
              "instructions_email": "API Test Data",
              "metadata": {
                "id": 607,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.913Z"
              },
              "reason": "fraudulent"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/charges/API Test Data/refund')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/charges/{charge}/refunds', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/charges/Sample Data/refunds')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/charges/{charge}/refunds', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/charges/API Test Data/refunds')
            .send({
              "amount": 897,
              "currency": "API Test Data",
              "expand": [
                "Sample Data"
              ],
              "instructions_email": "Test String",
              "metadata": {
                "id": 227,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.913Z"
              },
              "origin": "customer_balance",
              "reason": "fraudulent",
              "reverse_transfer": true
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/charges/API Test Data/refunds')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/charges/{charge}/refunds/{refund}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/charges/Generated Value/refunds/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/charges/{charge}/refunds/{refund}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/charges/Test String/refunds/Generated Value')
            .send({
              "expand": [
                "Test String"
              ],
              "metadata": {
                "id": 599,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.913Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/charges/Test String/refunds/Generated Value')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/checkout/sessions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/checkout/sessions')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/checkout/sessions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/checkout/sessions')
            .send({
              "adaptive_pricing": {
                "enabled": true
              },
              "allow_promotion_codes": true,
              "billing_address_collection": "required",
              "cancel_url": "API Test Data",
              "consent_collection": {
                "promotions": "none"
              },
              "custom_fields": [
                {
                  "dropdown": {
                    "default_value": "API Test Data",
                    "options": [
                      {
                        "label": "Test String",
                        "value": "Test String"
                      },
                      {
                        "label": "Generated Value",
                        "value": "Generated Value"
                      }
                    ]
                  },
                  "key": "Sample Data",
                  "label": {
                    "custom": "Test String",
                    "type": "custom"
                  },
                  "numeric": {
                    "default_value": "Sample Data",
                    "maximum_length": 128,
                    "minimum_length": 695
                  },
                  "optional": true,
                  "text": {
                    "default_value": "API Test Data",
                    "minimum_length": 24
                  },
                  "type": "text"
                },
                {
                  "dropdown": {
                    "options": [
                      {
                        "label": "API Test Data",
                        "value": "API Test Data"
                      }
                    ]
                  },
                  "key": "Generated Value",
                  "label": {
                    "custom": "Test String",
                    "type": "custom"
                  },
                  "numeric": {
                    "default_value": "API Test Data",
                    "maximum_length": 979
                  },
                  "optional": true,
                  "text": {
                    "minimum_length": 872
                  },
                  "type": "numeric"
                },
                {
                  "key": "Test String",
                  "label": {
                    "custom": "Sample Data",
                    "type": "custom"
                  },
                  "numeric": {
                    "default_value": "Test String",
                    "maximum_length": 991,
                    "minimum_length": 689
                  },
                  "text": {
                    "default_value": "Generated Value",
                    "maximum_length": 314,
                    "minimum_length": 140
                  },
                  "type": "dropdown"
                }
              ],
              "custom_text": {
                "after_submit": {
                  "id": 586,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.913Z"
                },
                "submit": {
                  "id": 239,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.913Z"
                }
              },
              "customer": "Sample Data",
              "customer_creation": "if_required",
              "customer_email": "Sample Data",
              "customer_update": {
                "address": "auto",
                "name": "auto",
                "shipping": "auto"
              },
              "discounts": [
                {
                  "promotion_code": "Generated Value"
                },
                {}
              ],
              "expand": [
                "Generated Value",
                "Sample Data",
                "Test String"
              ],
              "invoice_creation": {
                "enabled": true,
                "invoice_data": {
                  "account_tax_ids": {
                    "id": 281,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.913Z"
                  },
                  "custom_fields": {
                    "id": 905,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.913Z"
                  },
                  "description": "Sample Data",
                  "footer": "Sample Data",
                  "issuer": {
                    "account": "Generated Value",
                    "type": "self"
                  },
                  "metadata": {},
                  "rendering_options": {
                    "id": 477,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.913Z"
                  }
                }
              },
              "line_items": [
                {
                  "adjustable_quantity": {
                    "enabled": false,
                    "maximum": 28,
                    "minimum": 510
                  },
                  "price": "Generated Value",
                  "quantity": 508,
                  "tax_rates": [
                    "API Test Data",
                    "API Test Data",
                    "Test String"
                  ]
                },
                {
                  "dynamic_tax_rates": [
                    "Test String",
                    "API Test Data"
                  ],
                  "price": "Sample Data",
                  "price_data": {
                    "currency": "API Test Data",
                    "product": "Sample Data",
                    "unit_amount_decimal": "Test String"
                  },
                  "tax_rates": [
                    "Sample Data",
                    "Generated Value",
                    "API Test Data"
                  ]
                }
              ],
              "metadata": {},
              "optional_items": [
                {
                  "adjustable_quantity": {
                    "enabled": false,
                    "maximum": 465
                  },
                  "price": "API Test Data",
                  "quantity": 353
                },
                {
                  "price": "Sample Data",
                  "quantity": 636
                }
              ],
              "payment_intent_data": {
                "application_fee_amount": 150,
                "capture_method": "manual",
                "description": "Sample Data",
                "metadata": {},
                "receipt_email": "API Test Data",
                "setup_future_usage": "off_session",
                "shipping": {
                  "address": {
                    "city": "Sample Data",
                    "line1": "API Test Data",
                    "line2": "Test String"
                  },
                  "carrier": "API Test Data",
                  "name": "Generated Value"
                },
                "statement_descriptor": "Test String",
                "transfer_data": {
                  "destination": "Sample Data"
                },
                "transfer_group": "API Test Data"
              },
              "payment_method_collection": "if_required",
              "payment_method_configuration": "Generated Value",
              "payment_method_data": {},
              "payment_method_options": {
                "acss_debit": {
                  "currency": "usd",
                  "setup_future_usage": "on_session",
                  "target_date": "Sample Data",
                  "verification_method": "microdeposits"
                },
                "alipay": {},
                "amazon_pay": {
                  "setup_future_usage": "none"
                },
                "au_becs_debit": {},
                "bacs_debit": {
                  "setup_future_usage": "off_session"
                },
                "bancontact": {
                  "setup_future_usage": "none"
                },
                "boleto": {
                  "expires_after_days": 723
                },
                "card": {
                  "request_extended_authorization": "if_available",
                  "request_multicapture": "if_available",
                  "request_overcapture": "never",
                  "request_three_d_secure": "automatic",
                  "setup_future_usage": "off_session",
                  "statement_descriptor_suffix_kana": "Generated Value",
                  "statement_descriptor_suffix_kanji": "Test String"
                },
                "cashapp": {
                  "setup_future_usage": "off_session"
                },
                "customer_balance": {
                  "bank_transfer": {
                    "eu_bank_transfer": {
                      "country": "Generated Value"
                    },
                    "requested_address_types": [
                      "swift",
                      "iban"
                    ],
                    "type": "us_bank_transfer"
                  },
                  "setup_future_usage": "none"
                },
                "eps": {},
                "fpx": {
                  "setup_future_usage": "none"
                },
                "kakao_pay": {
                  "capture_method": "manual"
                },
                "klarna": {
                  "setup_future_usage": "none",
                  "subscriptions": {
                    "id": 960,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.913Z"
                  }
                },
                "konbini": {
                  "expires_after_days": 750,
                  "setup_future_usage": "none"
                },
                "kr_card": {
                  "capture_method": "manual",
                  "setup_future_usage": "off_session"
                },
                "mobilepay": {
                  "setup_future_usage": "none"
                },
                "multibanco": {},
                "naver_pay": {
                  "capture_method": "manual"
                },
                "oxxo": {
                  "setup_future_usage": "none"
                },
                "p24": {
                  "setup_future_usage": "none",
                  "tos_shown_and_accepted": false
                },
                "pay_by_bank": {},
                "paynow": {
                  "setup_future_usage": "none"
                },
                "pix": {},
                "revolut_pay": {
                  "setup_future_usage": "none"
                },
                "sofort": {},
                "us_bank_account": {
                  "verification_method": "instant"
                },
                "wechat_pay": {
                  "app_id": "Test String",
                  "client": "ios",
                  "setup_future_usage": "none"
                }
              },
              "payment_method_types": [
                "sofort"
              ],
              "permissions": {},
              "phone_number_collection": {
                "enabled": false
              },
              "redirect_on_completion": "never",
              "return_url": "Sample Data",
              "saved_payment_method_options": {
                "allow_redisplay_filters": [
                  "unspecified",
                  "limited"
                ],
                "payment_method_save": "disabled"
              },
              "setup_intent_data": {
                "metadata": {}
              },
              "submit_type": "donate",
              "success_url": "Generated Value",
              "tax_id_collection": {
                "enabled": true,
                "required": "never"
              },
              "ui_mode": "embedded",
              "wallet_options": {
                "link": {
                  "display": "never"
                }
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/checkout/sessions')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/checkout/sessions/{session}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/checkout/sessions/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/checkout/sessions/{session}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/checkout/sessions/Generated Value')
            .send({
              "metadata": {
                "id": 942,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.913Z"
              },
              "shipping_options": {
                "id": 24,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.913Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/checkout/sessions/Generated Value')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/checkout/sessions/{session}/expire', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/checkout/sessions/Generated Value/expire')
            .send({
              "expand": [
                "Sample Data",
                "Generated Value",
                "Test String"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/checkout/sessions/Generated Value/expire')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/checkout/sessions/{session}/line_items', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/checkout/sessions/Test String/line_items')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/climate/orders', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/climate/orders')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/climate/orders', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/climate/orders')
            .send({
              "amount": 826,
              "currency": "Generated Value",
              "expand": [
                "Generated Value"
              ],
              "metric_tons": "Sample Data",
              "product": "Generated Value"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/climate/orders')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/climate/orders/{order}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/climate/orders/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/climate/orders/{order}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/climate/orders/API Test Data')
            .send({
              "beneficiary": {
                "id": 508,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.913Z"
              },
              "expand": [
                "Sample Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/climate/orders/API Test Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/climate/orders/{order}/cancel', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/climate/orders/API Test Data/cancel')
            .send({})
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/climate/orders/API Test Data/cancel')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/climate/products', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/climate/products')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/climate/products/{product}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/climate/products/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/climate/suppliers', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/climate/suppliers')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/climate/suppliers/{supplier}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/climate/suppliers/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/confirmation_tokens/{confirmation_token}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/confirmation_tokens/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/country_specs', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/country_specs')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/country_specs/{country}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/country_specs/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/coupons', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/coupons')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/coupons', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/coupons')
            .send({
              "amount_off": 249,
              "applies_to": {
                "products": [
                  "API Test Data"
                ]
              },
              "currency": "Sample Data",
              "currency_options": {},
              "duration": "once",
              "duration_in_months": 944,
              "expand": [
                "API Test Data",
                "Sample Data",
                "Sample Data"
              ],
              "max_redemptions": 905,
              "metadata": {
                "id": 840,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "name": "Sample Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/coupons')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/coupons/{coupon}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/coupons/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/coupons/{coupon}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/coupons/Generated Value')
            .send({
              "currency_options": {},
              "metadata": {
                "id": 463,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "name": "API Test Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/coupons/Generated Value')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/coupons/{coupon}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/coupons/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/credit_notes', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/credit_notes')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/credit_notes', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/credit_notes')
            .send({
              "amount": 456,
              "credit_amount": 282,
              "effective_at": 603,
              "email_type": "credit_note",
              "invoice": "Test String",
              "refund_amount": 435
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/credit_notes')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/credit_notes/preview', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/credit_notes/preview')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/credit_notes/preview/lines', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/credit_notes/preview/lines')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/credit_notes/{credit_note}/lines', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/credit_notes/Sample Data/lines')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/credit_notes/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/credit_notes/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/credit_notes/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/credit_notes/Test String')
            .send({
              "expand": [
                "Generated Value",
                "API Test Data"
              ],
              "metadata": {}
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/credit_notes/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/credit_notes/{id}/void', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/credit_notes/API Test Data/void')
            .send({
              "expand": [
                "API Test Data",
                "Test String",
                "Generated Value"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/credit_notes/API Test Data/void')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/customer_sessions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/customer_sessions')
            .send({
              "components": {
                "buy_button": {
                  "enabled": false
                },
                "pricing_table": {
                  "enabled": true
                }
              },
              "customer": "Test String",
              "expand": [
                "Generated Value",
                "Generated Value",
                "API Test Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/customer_sessions')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/customers', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/customers', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/customers')
            .send({
              "balance": 844,
              "cash_balance": {
                "settings": {
                  "reconciliation_mode": "merchant_default"
                }
              },
              "expand": [
                "Sample Data"
              ],
              "invoice_prefix": "Generated Value",
              "metadata": {
                "id": 794,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "phone": "API Test Data",
              "preferred_locales": [
                "Sample Data",
                "API Test Data"
              ],
              "shipping": {
                "id": 205,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "source": "Sample Data",
              "tax": {
                "validate_location": "deferred"
              },
              "test_clock": "Test String"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/customers')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/customers/search', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers/search')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/customers/{customer}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/customers/{customer}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Generated Value')
            .send({
              "address": {
                "id": 519,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "balance": 673,
              "bank_account": {
                "id": 212,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "card": {
                "id": 97,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "cash_balance": {
                "settings": {}
              },
              "default_alipay_account": "Sample Data",
              "default_bank_account": "Test String",
              "description": "API Test Data",
              "email": "Sample Data",
              "invoice_prefix": "Generated Value",
              "invoice_settings": {
                "custom_fields": {
                  "id": 582,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.914Z"
                },
                "rendering_options": {
                  "id": 677,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.914Z"
                }
              },
              "metadata": {
                "id": 99,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "name": "Sample Data",
              "phone": "API Test Data",
              "shipping": {
                "id": 380,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Generated Value')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/customers/{customer}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/customers/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/customers/{customer}/balance_transactions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers/API Test Data/balance_transactions')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/customers/{customer}/balance_transactions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/API Test Data/balance_transactions')
            .send({
              "amount": 401,
              "currency": "Test String",
              "description": "Test String",
              "metadata": {
                "id": 230,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/API Test Data/balance_transactions')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/customers/{customer}/balance_transactions/{transaction}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers/Sample Data/balance_transactions/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/customers/{customer}/balance_transactions/{transaction}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Sample Data/balance_transactions/Sample Data')
            .send({
              "description": "API Test Data",
              "expand": [
                "API Test Data",
                "Sample Data",
                "Sample Data"
              ],
              "metadata": {
                "id": 759,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Sample Data/balance_transactions/Sample Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/customers/{customer}/bank_accounts', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers/Test String/bank_accounts')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/customers/{customer}/bank_accounts', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Sample Data/bank_accounts')
            .send({
              "alipay_account": "Sample Data",
              "bank_account": {
                "id": 702,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "card": {
                "id": 983,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "source": "Sample Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Sample Data/bank_accounts')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/customers/{customer}/bank_accounts/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers/Generated Value/bank_accounts/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/customers/{customer}/bank_accounts/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/API Test Data/bank_accounts/API Test Data')
            .send({
              "account_holder_name": "Test String",
              "address_line2": "Generated Value",
              "address_state": "Generated Value",
              "expand": [
                "Test String",
                "API Test Data"
              ],
              "metadata": {
                "id": 482,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "owner": {
                "address": {
                  "city": "Generated Value",
                  "line1": "Generated Value",
                  "line2": "Test String",
                  "postal_code": "Test String"
                },
                "email": "API Test Data",
                "name": "Generated Value",
                "phone": "Generated Value"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/API Test Data/bank_accounts/API Test Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/customers/{customer}/bank_accounts/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/customers/Sample Data/bank_accounts/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/customers/{customer}/bank_accounts/{id}/verify', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Generated Value/bank_accounts/Test String/verify')
            .send({
              "amounts": [
                659
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Generated Value/bank_accounts/Test String/verify')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/customers/{customer}/cards', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers/Test String/cards')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/customers/{customer}/cards', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Test String/cards')
            .send({
              "alipay_account": "API Test Data",
              "bank_account": {
                "id": 168,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "expand": [
                "Test String",
                "API Test Data"
              ],
              "metadata": {},
              "source": "Generated Value"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Test String/cards')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/customers/{customer}/cards/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers/Generated Value/cards/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/customers/{customer}/cards/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Sample Data/cards/Generated Value')
            .send({
              "account_holder_type": "company",
              "address_city": "API Test Data",
              "address_line1": "Sample Data",
              "address_line2": "Test String",
              "address_state": "Sample Data",
              "exp_year": "Test String",
              "expand": [
                "Generated Value",
                "API Test Data",
                "Generated Value"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Sample Data/cards/Generated Value')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/customers/{customer}/cards/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/customers/Generated Value/cards/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/customers/{customer}/cash_balance', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers/Test String/cash_balance')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/customers/{customer}/cash_balance', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Generated Value/cash_balance')
            .send({
              "expand": [
                "Test String",
                "Generated Value",
                "Sample Data"
              ],
              "settings": {
                "reconciliation_mode": "automatic"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Generated Value/cash_balance')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/customers/{customer}/cash_balance_transactions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers/API Test Data/cash_balance_transactions')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/customers/{customer}/cash_balance_transactions/{transaction}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers/Test String/cash_balance_transactions/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/customers/{customer}/discount', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers/Generated Value/discount')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('DELETE /v1/customers/{customer}/discount', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/customers/Sample Data/discount')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/customers/{customer}/funding_instructions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/API Test Data/funding_instructions')
            .send({
              "bank_transfer": {
                "eu_bank_transfer": {
                  "country": "Generated Value"
                },
                "requested_address_types": [
                  "spei"
                ],
                "type": "jp_bank_transfer"
              },
              "currency": "Test String",
              "funding_type": "bank_transfer"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/API Test Data/funding_instructions')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/customers/{customer}/payment_methods', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers/API Test Data/payment_methods')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/customers/{customer}/payment_methods/{payment_method}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers/Generated Value/payment_methods/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/customers/{customer}/sources', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers/Test String/sources')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/customers/{customer}/sources', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/API Test Data/sources')
            .send({
              "bank_account": {
                "id": 660,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "card": {
                "id": 779,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "expand": [
                "API Test Data",
                "Test String"
              ],
              "source": "Generated Value"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/API Test Data/sources')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/customers/{customer}/sources/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers/Generated Value/sources/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/customers/{customer}/sources/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Test String/sources/API Test Data')
            .send({
              "account_holder_type": "individual",
              "address_city": "Test String",
              "address_country": "Test String",
              "address_line1": "API Test Data",
              "address_line2": "Generated Value",
              "address_state": "Test String",
              "address_zip": "Generated Value",
              "exp_month": "API Test Data",
              "expand": [
                "Sample Data",
                "Generated Value"
              ],
              "name": "Generated Value",
              "owner": {
                "address": {
                  "city": "Generated Value",
                  "country": "Generated Value",
                  "line2": "Generated Value"
                },
                "email": "API Test Data",
                "name": "Generated Value",
                "phone": "API Test Data"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Test String/sources/API Test Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/customers/{customer}/sources/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/customers/Sample Data/sources/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/customers/{customer}/sources/{id}/verify', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Test String/sources/Generated Value/verify')
            .send({
              "amounts": [
                448,
                715
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Test String/sources/Generated Value/verify')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/customers/{customer}/subscriptions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers/Sample Data/subscriptions')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/customers/{customer}/subscriptions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Sample Data/subscriptions')
            .send({
              "add_invoice_items": [
                {
                  "discounts": [
                    {
                      "discount": "Sample Data",
                      "promotion_code": "Test String"
                    },
                    {
                      "discount": "Generated Value",
                      "promotion_code": "Test String"
                    },
                    {
                      "coupon": "Test String"
                    }
                  ],
                  "price": "Generated Value",
                  "quantity": 753
                },
                {
                  "discounts": [
                    {
                      "promotion_code": "API Test Data"
                    },
                    {
                      "coupon": "API Test Data",
                      "discount": "API Test Data",
                      "promotion_code": "API Test Data"
                    },
                    {
                      "discount": "Test String",
                      "promotion_code": "Test String"
                    }
                  ],
                  "price": "Test String",
                  "price_data": {
                    "currency": "Sample Data",
                    "product": "Generated Value",
                    "unit_amount": 989,
                    "unit_amount_decimal": "Generated Value"
                  },
                  "quantity": 858
                },
                {
                  "discounts": [
                    {
                      "discount": "Sample Data",
                      "promotion_code": "Generated Value"
                    }
                  ],
                  "tax_rates": {
                    "id": 35,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.914Z"
                  }
                }
              ],
              "application_fee_percent": {
                "id": 570,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "automatic_tax": {
                "enabled": true,
                "liability": {
                  "account": "Generated Value",
                  "type": "account"
                }
              },
              "backdate_start_date": 240,
              "billing_cycle_anchor": 543,
              "billing_thresholds": {
                "id": 324,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "cancel_at_period_end": false,
              "collection_method": "send_invoice",
              "days_until_due": 809,
              "default_payment_method": "API Test Data",
              "default_tax_rates": {
                "id": 405,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "discounts": {
                "id": 792,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "expand": [
                "Sample Data",
                "Generated Value"
              ],
              "off_session": true,
              "payment_behavior": "pending_if_incomplete",
              "payment_settings": {
                "payment_method_options": {
                  "acss_debit": {
                    "id": 670,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.914Z"
                  },
                  "sepa_debit": {
                    "id": 277,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.914Z"
                  },
                  "us_bank_account": {
                    "id": 141,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.914Z"
                  }
                },
                "payment_method_types": {
                  "id": 41,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.914Z"
                },
                "save_default_payment_method": "off"
              },
              "pending_invoice_item_interval": {
                "id": 492,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "proration_behavior": "none",
              "transfer_data": {
                "destination": "Test String"
              },
              "trial_end": {
                "id": 98,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "trial_from_plan": true,
              "trial_period_days": 202,
              "trial_settings": {
                "end_behavior": {
                  "missing_payment_method": "pause"
                }
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Sample Data/subscriptions')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/customers/{customer}/subscriptions/{subscription_exposed_id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers/Test String/subscriptions/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/customers/{customer}/subscriptions/{subscription_exposed_id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Generated Value/subscriptions/Test String')
            .send({
              "add_invoice_items": [
                {
                  "price": "API Test Data",
                  "tax_rates": {
                    "id": 143,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.914Z"
                  }
                },
                {
                  "discounts": [
                    {
                      "coupon": "Sample Data"
                    },
                    {
                      "coupon": "Generated Value",
                      "discount": "API Test Data",
                      "promotion_code": "Test String"
                    },
                    {
                      "coupon": "API Test Data",
                      "promotion_code": "Sample Data"
                    }
                  ],
                  "price_data": {
                    "currency": "Sample Data",
                    "product": "Sample Data",
                    "tax_behavior": "exclusive",
                    "unit_amount": 8,
                    "unit_amount_decimal": "API Test Data"
                  },
                  "quantity": 247,
                  "tax_rates": {
                    "id": 306,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.914Z"
                  }
                }
              ],
              "billing_cycle_anchor": "unchanged",
              "billing_thresholds": {
                "id": 59,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "cancel_at": {
                "id": 898,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "cancel_at_period_end": false,
              "cancellation_details": {
                "feedback": "other"
              },
              "days_until_due": 241,
              "default_tax_rates": {
                "id": 166,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "discounts": {
                "id": 364,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "expand": [
                "Sample Data",
                "Test String"
              ],
              "items": [
                {
                  "billing_thresholds": {
                    "id": 959,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.914Z"
                  },
                  "clear_usage": true,
                  "deleted": true,
                  "discounts": {
                    "id": 167,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.914Z"
                  },
                  "id": "API Test Data",
                  "metadata": {
                    "id": 8,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.914Z"
                  },
                  "price_data": {
                    "currency": "Sample Data",
                    "product": "Sample Data",
                    "recurring": {
                      "interval": "week",
                      "interval_count": 373
                    },
                    "tax_behavior": "unspecified",
                    "unit_amount": 35,
                    "unit_amount_decimal": "API Test Data"
                  },
                  "tax_rates": {
                    "id": 240,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.914Z"
                  }
                }
              ],
              "metadata": {
                "id": 141,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "off_session": true,
              "pause_collection": {
                "id": 726,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "payment_behavior": "pending_if_incomplete",
              "payment_settings": {
                "payment_method_options": {
                  "acss_debit": {
                    "id": 244,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.914Z"
                  },
                  "card": {
                    "id": 436,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.914Z"
                  },
                  "konbini": {
                    "id": 174,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.914Z"
                  },
                  "sepa_debit": {
                    "id": 51,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.914Z"
                  }
                },
                "save_default_payment_method": "on_subscription"
              },
              "pending_invoice_item_interval": {
                "id": 584,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "proration_date": 708,
              "trial_end": {
                "id": 88,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.914Z"
              },
              "trial_from_plan": false,
              "trial_settings": {
                "end_behavior": {
                  "missing_payment_method": "create_invoice"
                }
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Generated Value/subscriptions/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/customers/{customer}/subscriptions/{subscription_exposed_id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/customers/API Test Data/subscriptions/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers/Generated Value/subscriptions/API Test Data/discount')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('DELETE /v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/customers/Sample Data/subscriptions/Generated Value/discount')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/customers/{customer}/tax_ids', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers/Generated Value/tax_ids')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/customers/{customer}/tax_ids', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Generated Value/tax_ids')
            .send({
              "expand": [
                "Test String",
                "API Test Data",
                "Generated Value"
              ],
              "type": "tw_vat",
              "value": "Generated Value"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/customers/Generated Value/tax_ids')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/customers/{customer}/tax_ids/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/customers/Test String/tax_ids/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('DELETE /v1/customers/{customer}/tax_ids/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/customers/Sample Data/tax_ids/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/disputes', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/disputes')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/disputes/{dispute}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/disputes/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/disputes/{dispute}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/disputes/API Test Data')
            .send({
              "evidence": {
                "access_activity_log": "Sample Data",
                "billing_address": "API Test Data",
                "cancellation_policy": "Sample Data",
                "cancellation_policy_disclosure": "Sample Data",
                "cancellation_rebuttal": "API Test Data",
                "customer_communication": "API Test Data",
                "customer_name": "API Test Data",
                "customer_purchase_ip": "Test String",
                "duplicate_charge_documentation": "Sample Data",
                "enhanced_evidence": {
                  "id": 876,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.915Z"
                },
                "product_description": "Sample Data",
                "refund_policy_disclosure": "Generated Value",
                "refund_refusal_explanation": "Test String",
                "service_date": "Generated Value",
                "shipping_address": "Test String",
                "shipping_carrier": "Generated Value",
                "shipping_date": "API Test Data",
                "shipping_documentation": "Generated Value",
                "shipping_tracking_number": "Generated Value",
                "uncategorized_file": "Sample Data",
                "uncategorized_text": "Test String"
              },
              "expand": [
                "Test String",
                "API Test Data",
                "API Test Data"
              ],
              "metadata": {
                "id": 819,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.915Z"
              },
              "submit": false
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/disputes/API Test Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/disputes/{dispute}/close', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/disputes/Sample Data/close')
            .send({
              "expand": [
                "Sample Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/disputes/Sample Data/close')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/entitlements/active_entitlements', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/entitlements/active_entitlements')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/entitlements/active_entitlements/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/entitlements/active_entitlements/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/entitlements/features', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/entitlements/features')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/entitlements/features', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/entitlements/features')
            .send({
              "lookup_key": "Test String",
              "metadata": {},
              "name": "Test String"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/entitlements/features')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/entitlements/features/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/entitlements/features/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/entitlements/features/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/entitlements/features/Generated Value')
            .send({
              "metadata": {
                "id": 43,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.915Z"
              },
              "name": "API Test Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/entitlements/features/Generated Value')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/ephemeral_keys', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/ephemeral_keys')
            .send({
              "customer": "Generated Value",
              "expand": [
                "API Test Data"
              ],
              "issuing_card": "Generated Value"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/ephemeral_keys')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/ephemeral_keys/{key}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/ephemeral_keys/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/events', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/events')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/events/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/events/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/exchange_rates', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/exchange_rates')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/exchange_rates/{rate_id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/exchange_rates/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/external_accounts/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/external_accounts/API Test Data')
            .send({
              "account_holder_name": "Generated Value",
              "account_holder_type": "individual",
              "account_type": "futsu",
              "address_country": "Sample Data",
              "address_line1": "API Test Data",
              "address_line2": "Test String",
              "address_state": "Generated Value",
              "address_zip": "API Test Data",
              "default_for_currency": false,
              "exp_month": "Generated Value",
              "exp_year": "Generated Value",
              "expand": [
                "Test String",
                "Generated Value"
              ],
              "metadata": {
                "id": 678,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.915Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/external_accounts/API Test Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/file_links', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/file_links')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/file_links', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/file_links')
            .send({
              "expires_at": 219,
              "file": "Test String"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/file_links')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/file_links/{link}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/file_links/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/file_links/{link}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/file_links/Generated Value')
            .send({
              "expand": [
                "API Test Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/file_links/Generated Value')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/files', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/files')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/files', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/files')
            .send({
              "file": "Test String",
              "purpose": "account_requirement"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/files')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/files/{file}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/files/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/financial_connections/accounts', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/financial_connections/accounts')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/financial_connections/accounts/{account}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/financial_connections/accounts/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/financial_connections/accounts/{account}/disconnect', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/financial_connections/accounts/Test String/disconnect')
            .send({})
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/financial_connections/accounts/Test String/disconnect')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/financial_connections/accounts/{account}/owners', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/financial_connections/accounts/Generated Value/owners')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/financial_connections/accounts/{account}/refresh', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/financial_connections/accounts/Test String/refresh')
            .send({
              "expand": [
                "Test String",
                "Test String",
                "Sample Data"
              ],
              "features": [
                "ownership"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/financial_connections/accounts/Test String/refresh')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/financial_connections/accounts/{account}/subscribe', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/financial_connections/accounts/Sample Data/subscribe')
            .send({
              "expand": [
                "Sample Data"
              ],
              "features": [
                "transactions"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/financial_connections/accounts/Sample Data/subscribe')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/financial_connections/accounts/{account}/unsubscribe', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/financial_connections/accounts/Sample Data/unsubscribe')
            .send({
              "expand": [
                "API Test Data"
              ],
              "features": [
                "transactions",
                "transactions",
                "transactions"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/financial_connections/accounts/Sample Data/unsubscribe')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/financial_connections/sessions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/financial_connections/sessions')
            .send({
              "account_holder": {
                "customer": "Test String",
                "type": "customer"
              },
              "expand": [
                "API Test Data"
              ],
              "filters": {
                "account_subcategories": [
                  "mortgage",
                  "credit_card"
                ],
                "countries": [
                  "Test String",
                  "Test String"
                ]
              },
              "permissions": [
                "balances",
                "payment_method"
              ],
              "return_url": "Sample Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/financial_connections/sessions')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/financial_connections/sessions/{session}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/financial_connections/sessions/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/financial_connections/transactions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/financial_connections/transactions')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/financial_connections/transactions/{transaction}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/financial_connections/transactions/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/forwarding/requests', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/forwarding/requests')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/forwarding/requests', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/forwarding/requests')
            .send({
              "expand": [
                "API Test Data"
              ],
              "metadata": {},
              "payment_method": "API Test Data",
              "replacements": [
                "card_number",
                "card_cvc",
                "card_cvc"
              ],
              "url": "API Test Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/forwarding/requests')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/forwarding/requests/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/forwarding/requests/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/identity/verification_reports', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/identity/verification_reports')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/identity/verification_reports/{report}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/identity/verification_reports/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/identity/verification_sessions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/identity/verification_sessions')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/identity/verification_sessions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/identity/verification_sessions')
            .send({
              "client_reference_id": "Generated Value",
              "metadata": {},
              "provided_details": {},
              "related_customer": "API Test Data",
              "return_url": "Generated Value",
              "verification_flow": "API Test Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/identity/verification_sessions')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/identity/verification_sessions/{session}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/identity/verification_sessions/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/identity/verification_sessions/{session}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/identity/verification_sessions/API Test Data')
            .send({
              "expand": [
                "API Test Data",
                "Test String"
              ],
              "metadata": {},
              "options": {},
              "provided_details": {
                "email": "Generated Value",
                "phone": "Test String"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/identity/verification_sessions/API Test Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/identity/verification_sessions/{session}/cancel', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/identity/verification_sessions/API Test Data/cancel')
            .send({
              "expand": [
                "Test String",
                "Sample Data",
                "API Test Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/identity/verification_sessions/API Test Data/cancel')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/identity/verification_sessions/{session}/redact', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/identity/verification_sessions/Test String/redact')
            .send({
              "expand": [
                "Generated Value",
                "Test String",
                "API Test Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/identity/verification_sessions/Test String/redact')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/invoice_payments', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/invoice_payments')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/invoice_payments/{invoice_payment}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/invoice_payments/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/invoice_rendering_templates', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/invoice_rendering_templates')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/invoice_rendering_templates/{template}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/invoice_rendering_templates/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/invoice_rendering_templates/{template}/archive', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/invoice_rendering_templates/Test String/archive')
            .send({
              "expand": [
                "Generated Value",
                "Generated Value",
                "Sample Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/invoice_rendering_templates/Test String/archive')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/invoice_rendering_templates/{template}/unarchive', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/invoice_rendering_templates/Sample Data/unarchive')
            .send({
              "expand": [
                "API Test Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/invoice_rendering_templates/Sample Data/unarchive')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/invoiceitems', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/invoiceitems')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/invoiceitems', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/invoiceitems')
            .send({
              "amount": 533,
              "currency": "Sample Data",
              "customer": "Sample Data",
              "description": "Test String",
              "expand": [
                "Test String",
                "API Test Data"
              ],
              "period": {
                "end": 25,
                "start": 646
              },
              "subscription": "Sample Data",
              "tax_code": {
                "id": 578,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.915Z"
              },
              "tax_rates": [
                "API Test Data"
              ],
              "unit_amount_decimal": "Generated Value"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/invoiceitems')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/invoiceitems/{invoiceitem}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/invoiceitems/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/invoiceitems/{invoiceitem}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/invoiceitems/API Test Data')
            .send({
              "amount": 461,
              "description": "Test String",
              "expand": [
                "Generated Value",
                "Test String"
              ],
              "price_data": {
                "currency": "API Test Data",
                "product": "Generated Value",
                "tax_behavior": "exclusive",
                "unit_amount": 183,
                "unit_amount_decimal": "Sample Data"
              },
              "pricing": {
                "price": "Test String"
              },
              "quantity": 943,
              "tax_behavior": "unspecified",
              "tax_code": {
                "id": 568,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.915Z"
              },
              "tax_rates": {
                "id": 411,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.915Z"
              },
              "unit_amount_decimal": "Sample Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/invoiceitems/API Test Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/invoiceitems/{invoiceitem}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/invoiceitems/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/invoices', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/invoices')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/invoices', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices')
            .send({
              "application_fee_amount": 897,
              "auto_advance": true,
              "automatically_finalizes_at": 265,
              "collection_method": "send_invoice",
              "currency": "Test String",
              "custom_fields": {
                "id": 817,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.916Z"
              },
              "default_payment_method": "Sample Data",
              "default_tax_rates": [
                "Test String"
              ],
              "description": "Generated Value",
              "due_date": 359,
              "effective_at": 533,
              "footer": "Generated Value",
              "issuer": {
                "account": "Generated Value",
                "type": "account"
              },
              "metadata": {
                "id": 939,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.916Z"
              },
              "number": "API Test Data",
              "on_behalf_of": "Sample Data",
              "pending_invoice_items_behavior": "exclude",
              "shipping_cost": {
                "shipping_rate": "Test String",
                "shipping_rate_data": {
                  "delivery_estimate": {
                    "maximum": {
                      "unit": "month",
                      "value": 539
                    },
                    "minimum": {
                      "unit": "week",
                      "value": 339
                    }
                  },
                  "display_name": "Sample Data",
                  "tax_behavior": "inclusive",
                  "type": "fixed_amount"
                }
              },
              "shipping_details": {
                "address": {
                  "city": "Generated Value",
                  "country": "Sample Data",
                  "line2": "Sample Data",
                  "postal_code": "Generated Value"
                },
                "name": "Sample Data"
              },
              "statement_descriptor": "Generated Value",
              "subscription": "Generated Value",
              "transfer_data": {
                "amount": 361,
                "destination": "API Test Data"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/invoices/create_preview', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/create_preview')
            .send({
              "automatic_tax": {
                "enabled": false
              },
              "currency": "Sample Data",
              "customer": "Sample Data",
              "customer_details": {
                "address": {
                  "id": 68,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.916Z"
                },
                "tax_exempt": "",
                "tax_ids": [
                  {
                    "type": "kz_bin",
                    "value": "Sample Data"
                  }
                ]
              },
              "expand": [
                "API Test Data",
                "API Test Data"
              ],
              "invoice_items": [
                {
                  "amount": 926,
                  "discounts": {
                    "id": 104,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  },
                  "invoiceitem": "Generated Value",
                  "period": {
                    "end": 17,
                    "start": 133
                  },
                  "quantity": 817,
                  "tax_behavior": "inclusive",
                  "tax_code": {
                    "id": 863,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  },
                  "tax_rates": {
                    "id": 521,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  },
                  "unit_amount": 554
                },
                {
                  "amount": 284,
                  "currency": "Generated Value",
                  "description": "Generated Value",
                  "discounts": {
                    "id": 164,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  },
                  "metadata": {
                    "id": 933,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  },
                  "period": {
                    "end": 320,
                    "start": 309
                  },
                  "price": "Generated Value",
                  "quantity": 24,
                  "tax_behavior": "exclusive",
                  "tax_rates": {
                    "id": 455,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  },
                  "unit_amount": 191,
                  "unit_amount_decimal": "Generated Value"
                }
              ],
              "issuer": {
                "account": "Sample Data",
                "type": "account"
              },
              "on_behalf_of": {
                "id": 585,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.916Z"
              },
              "preview_mode": "recurring",
              "schedule": "Generated Value",
              "schedule_details": {
                "billing_mode": {
                  "type": "classic"
                },
                "end_behavior": "cancel",
                "proration_behavior": "create_prorations"
              },
              "subscription": "Sample Data",
              "subscription_details": {
                "cancel_at_period_end": true,
                "cancel_now": false,
                "default_tax_rates": {
                  "id": 363,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.916Z"
                },
                "items": [
                  {
                    "clear_usage": true,
                    "deleted": false,
                    "discounts": {
                      "id": 358,
                      "name": "Generated Test Data",
                      "status": "active",
                      "createdAt": "2025-08-14T09:47:07.916Z"
                    },
                    "id": "Sample Data",
                    "metadata": {
                      "id": 510,
                      "name": "Generated Test Data",
                      "status": "active",
                      "createdAt": "2025-08-14T09:47:07.916Z"
                    },
                    "price": "API Test Data",
                    "price_data": {
                      "currency": "API Test Data",
                      "product": "Generated Value",
                      "recurring": {
                        "interval": "month",
                        "interval_count": 548
                      }
                    },
                    "quantity": 192
                  }
                ],
                "resume_at": "now",
                "start_date": 136,
                "trial_end": {
                  "id": 760,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.916Z"
                }
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/create_preview')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/invoices/search', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/invoices/search')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/invoices/{invoice}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/invoices/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/invoices/{invoice}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/Sample Data')
            .send({
              "account_tax_ids": {
                "id": 104,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.916Z"
              },
              "application_fee_amount": 573,
              "automatic_tax": {
                "enabled": true
              },
              "collection_method": "charge_automatically",
              "custom_fields": {
                "id": 420,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.916Z"
              },
              "default_payment_method": "API Test Data",
              "default_source": {
                "id": 74,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.916Z"
              },
              "description": "API Test Data",
              "discounts": {
                "id": 381,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.916Z"
              },
              "effective_at": {
                "id": 732,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.916Z"
              },
              "footer": "Test String",
              "issuer": {
                "account": "Sample Data",
                "type": "self"
              },
              "metadata": {
                "id": 983,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.916Z"
              },
              "number": {
                "id": 718,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.916Z"
              },
              "on_behalf_of": {
                "id": 293,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.916Z"
              },
              "payment_settings": {
                "default_mandate": {
                  "id": 837,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.916Z"
                },
                "payment_method_options": {
                  "card": {
                    "id": 532,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  },
                  "customer_balance": {
                    "id": 725,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  },
                  "konbini": {
                    "id": 971,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  },
                  "sepa_debit": {
                    "id": 723,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  },
                  "us_bank_account": {
                    "id": 233,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  }
                }
              },
              "shipping_cost": {
                "id": 229,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.916Z"
              },
              "transfer_data": {
                "id": 834,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.916Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/Sample Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/invoices/{invoice}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/invoices/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/invoices/{invoice}/add_lines', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/Sample Data/add_lines')
            .send({
              "expand": [
                "Test String",
                "Generated Value",
                "API Test Data"
              ],
              "lines": [
                {
                  "amount": 21,
                  "discounts": {
                    "id": 442,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  },
                  "metadata": {
                    "id": 374,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  },
                  "price_data": {
                    "currency": "Sample Data",
                    "product": "Test String",
                    "product_data": {
                      "description": "Sample Data",
                      "metadata": {},
                      "name": "API Test Data"
                    },
                    "unit_amount_decimal": "Sample Data"
                  },
                  "pricing": {},
                  "quantity": 991,
                  "tax_amounts": {
                    "id": 187,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  },
                  "tax_rates": {
                    "id": 154,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  }
                }
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/Sample Data/add_lines')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/invoices/{invoice}/attach_payment', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/Test String/attach_payment')
            .send({
              "expand": [
                "Test String",
                "Test String",
                "Test String"
              ],
              "payment_intent": "API Test Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/Test String/attach_payment')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/invoices/{invoice}/finalize', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/API Test Data/finalize')
            .send({
              "expand": [
                "Generated Value",
                "Sample Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/API Test Data/finalize')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/invoices/{invoice}/lines', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/invoices/Test String/lines')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/invoices/{invoice}/lines/{line_item_id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/Test String/lines/Test String')
            .send({
              "amount": 697,
              "discountable": true,
              "metadata": {
                "id": 57,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.916Z"
              },
              "period": {
                "end": 677,
                "start": 922
              },
              "price_data": {
                "currency": "API Test Data",
                "product_data": {
                  "description": "API Test Data",
                  "metadata": {},
                  "name": "Test String",
                  "tax_code": "Generated Value"
                },
                "tax_behavior": "exclusive",
                "unit_amount": 592
              },
              "pricing": {},
              "tax_amounts": {
                "id": 104,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.916Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/Test String/lines/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/invoices/{invoice}/mark_uncollectible', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/Generated Value/mark_uncollectible')
            .send({
              "expand": [
                "Sample Data",
                "Generated Value",
                "Test String"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/Generated Value/mark_uncollectible')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/invoices/{invoice}/pay', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/Test String/pay')
            .send({
              "expand": [
                "Generated Value"
              ],
              "mandate": {
                "id": 433,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.916Z"
              },
              "paid_out_of_band": true,
              "payment_method": "Sample Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/Test String/pay')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/invoices/{invoice}/remove_lines', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/API Test Data/remove_lines')
            .send({
              "expand": [
                "Test String",
                "Sample Data"
              ],
              "lines": [
                {
                  "behavior": "unassign",
                  "id": "Generated Value"
                }
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/API Test Data/remove_lines')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/invoices/{invoice}/send', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/Sample Data/send')
            .send({})
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/Sample Data/send')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/invoices/{invoice}/update_lines', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/Generated Value/update_lines')
            .send({
              "expand": [
                "API Test Data"
              ],
              "lines": [
                {
                  "description": "Test String",
                  "discounts": {
                    "id": 251,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  },
                  "id": "API Test Data",
                  "metadata": {
                    "id": 252,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  },
                  "period": {
                    "end": 882,
                    "start": 423
                  },
                  "price_data": {
                    "currency": "Generated Value",
                    "product": "API Test Data",
                    "product_data": {
                      "description": "API Test Data",
                      "images": [
                        "Generated Value",
                        "Generated Value",
                        "API Test Data"
                      ],
                      "metadata": {},
                      "name": "Sample Data",
                      "tax_code": "API Test Data"
                    },
                    "tax_behavior": "inclusive",
                    "unit_amount_decimal": "Test String"
                  },
                  "pricing": {
                    "price": "API Test Data"
                  },
                  "tax_amounts": {
                    "id": 946,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  }
                },
                {
                  "discountable": false,
                  "discounts": {
                    "id": 523,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  },
                  "id": "API Test Data",
                  "price_data": {
                    "currency": "Generated Value",
                    "product": "API Test Data",
                    "product_data": {
                      "description": "Test String",
                      "images": [
                        "API Test Data",
                        "Test String"
                      ],
                      "metadata": {},
                      "name": "Generated Value",
                      "tax_code": "API Test Data"
                    },
                    "unit_amount": 699,
                    "unit_amount_decimal": "API Test Data"
                  },
                  "quantity": 82,
                  "tax_amounts": {
                    "id": 919,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  },
                  "tax_rates": {
                    "id": 746,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  }
                },
                {
                  "amount": 611,
                  "description": "Sample Data",
                  "discountable": false,
                  "discounts": {
                    "id": 574,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  },
                  "id": "Test String",
                  "price_data": {
                    "currency": "Generated Value",
                    "product_data": {
                      "description": "API Test Data",
                      "metadata": {},
                      "name": "API Test Data",
                      "tax_code": "Sample Data"
                    },
                    "tax_behavior": "unspecified",
                    "unit_amount": 624,
                    "unit_amount_decimal": "Test String"
                  },
                  "pricing": {},
                  "tax_rates": {
                    "id": 631,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.916Z"
                  }
                }
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/Generated Value/update_lines')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/invoices/{invoice}/void', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/Sample Data/void')
            .send({
              "expand": [
                "API Test Data",
                "API Test Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/invoices/Sample Data/void')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/issuing/authorizations', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/issuing/authorizations')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/issuing/authorizations/{authorization}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/issuing/authorizations/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/issuing/authorizations/{authorization}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/authorizations/Test String')
            .send({
              "expand": [
                "API Test Data",
                "Generated Value",
                "Test String"
              ],
              "metadata": {
                "id": 766,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.916Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/authorizations/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/issuing/authorizations/{authorization}/approve', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/authorizations/Test String/approve')
            .send({
              "amount": 177,
              "expand": [
                "API Test Data"
              ],
              "metadata": {
                "id": 548,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.916Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/authorizations/Test String/approve')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/issuing/authorizations/{authorization}/decline', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/authorizations/Test String/decline')
            .send({
              "expand": [
                "Generated Value",
                "API Test Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/authorizations/Test String/decline')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/issuing/cardholders', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/issuing/cardholders')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/issuing/cardholders', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/cardholders')
            .send({
              "billing": {
                "address": {
                  "city": "Generated Value",
                  "country": "Sample Data",
                  "line1": "Generated Value",
                  "line2": "Generated Value",
                  "postal_code": "Sample Data",
                  "state": "API Test Data"
                }
              },
              "company": {},
              "email": "API Test Data",
              "expand": [
                "Test String"
              ],
              "individual": {
                "card_issuing": {
                  "user_terms_acceptance": {
                    "date": 942,
                    "ip": "Test String",
                    "user_agent": {
                      "id": 361,
                      "name": "Generated Test Data",
                      "status": "active",
                      "createdAt": "2025-08-14T09:47:07.916Z"
                    }
                  }
                },
                "dob": {
                  "day": 265,
                  "month": 503,
                  "year": 626
                },
                "first_name": "API Test Data",
                "last_name": "Sample Data",
                "verification": {
                  "document": {
                    "back": "Test String",
                    "front": "API Test Data"
                  }
                }
              },
              "metadata": {},
              "name": "Sample Data",
              "preferred_locales": [
                "fr",
                "es"
              ],
              "spending_controls": {
                "allowed_categories": [
                  "uniforms_commercial_clothing",
                  "civic_social_fraternal_associations",
                  "courier_services"
                ],
                "allowed_merchant_countries": [
                  "Sample Data",
                  "Test String",
                  "Test String"
                ],
                "blocked_categories": [
                  "auto_and_home_supply_stores"
                ],
                "blocked_merchant_countries": [
                  "Sample Data",
                  "Test String",
                  "Generated Value"
                ],
                "spending_limits": [
                  {
                    "amount": 86,
                    "categories": [
                      "drapery_window_covering_and_upholstery_stores",
                      "miscellaneous_business_services"
                    ],
                    "interval": "all_time"
                  },
                  {
                    "amount": 151,
                    "categories": [
                      "tent_and_awning_shops",
                      "airports_flying_fields",
                      "nursing_personal_care"
                    ],
                    "interval": "daily"
                  },
                  {
                    "amount": 680,
                    "interval": "weekly"
                  }
                ],
                "spending_limits_currency": "Generated Value"
              },
              "status": "inactive"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/cardholders')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/issuing/cardholders/{cardholder}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/issuing/cardholders/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/issuing/cardholders/{cardholder}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/cardholders/Test String')
            .send({
              "email": "Generated Value",
              "expand": [
                "Test String"
              ],
              "individual": {
                "card_issuing": {
                  "user_terms_acceptance": {
                    "date": 502,
                    "ip": "Test String",
                    "user_agent": {
                      "id": 126,
                      "name": "Generated Test Data",
                      "status": "active",
                      "createdAt": "2025-08-14T09:47:07.916Z"
                    }
                  }
                },
                "last_name": "Sample Data"
              },
              "metadata": {},
              "phone_number": "Test String",
              "preferred_locales": [
                "de",
                "it",
                "fr"
              ],
              "spending_controls": {
                "allowed_categories": [
                  "dairy_products_stores",
                  "emergency_services_gcas_visa_use_only",
                  "service_stations"
                ],
                "blocked_categories": [
                  "direct_marketing_other"
                ],
                "blocked_merchant_countries": [
                  "API Test Data",
                  "Test String"
                ],
                "spending_limits": [
                  {
                    "amount": 987,
                    "categories": [
                      "digital_goods_applications",
                      "dry_cleaners",
                      "specialty_cleaning"
                    ],
                    "interval": "monthly"
                  },
                  {
                    "amount": 42,
                    "interval": "weekly"
                  },
                  {
                    "amount": 719,
                    "categories": [
                      "electronics_stores"
                    ],
                    "interval": "all_time"
                  }
                ]
              },
              "status": "active"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/cardholders/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/issuing/cards', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/issuing/cards')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/issuing/cards', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/cards')
            .send({
              "cardholder": "Test String",
              "currency": "Sample Data",
              "expand": [
                "Sample Data",
                "API Test Data",
                "Generated Value"
              ],
              "financial_account": "Sample Data",
              "metadata": {},
              "personalization_design": "Sample Data",
              "pin": {
                "encrypted_number": "Sample Data"
              },
              "replacement_for": "API Test Data",
              "second_line": {
                "id": 621,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.916Z"
              },
              "shipping": {
                "address": {
                  "city": "Test String",
                  "country": "API Test Data",
                  "line1": "API Test Data",
                  "postal_code": "Sample Data",
                  "state": "Test String"
                },
                "address_validation": {
                  "mode": "disabled"
                },
                "customs": {
                  "eori_number": "API Test Data"
                },
                "name": "API Test Data",
                "require_signature": false,
                "service": "priority",
                "type": "individual"
              },
              "spending_controls": {
                "allowed_merchant_countries": [
                  "Generated Value",
                  "API Test Data",
                  "Sample Data"
                ],
                "blocked_categories": [
                  "electronics_repair_shops",
                  "mobile_home_dealers"
                ]
              },
              "status": "inactive",
              "type": "physical"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/cards')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/issuing/cards/{card}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/issuing/cards/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/issuing/cards/{card}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/cards/Test String')
            .send({
              "cancellation_reason": "lost",
              "expand": [
                "Sample Data",
                "Generated Value",
                "Sample Data"
              ],
              "metadata": {
                "id": 390,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.917Z"
              },
              "personalization_design": "Sample Data",
              "pin": {},
              "shipping": {
                "address": {
                  "city": "Sample Data",
                  "country": "Generated Value",
                  "line1": "Generated Value",
                  "line2": "Test String",
                  "postal_code": "Generated Value"
                },
                "address_validation": {
                  "mode": "disabled"
                },
                "name": "Sample Data",
                "require_signature": true,
                "service": "express"
              },
              "spending_controls": {
                "allowed_merchant_countries": [
                  "Sample Data"
                ],
                "blocked_categories": [
                  "electric_vehicle_charging",
                  "nondurable_goods"
                ],
                "blocked_merchant_countries": [
                  "API Test Data",
                  "API Test Data"
                ],
                "spending_limits": [
                  {
                    "amount": 657,
                    "interval": "yearly"
                  },
                  {
                    "amount": 476,
                    "categories": [
                      "construction_materials"
                    ],
                    "interval": "monthly"
                  },
                  {
                    "amount": 848,
                    "interval": "weekly"
                  }
                ]
              },
              "status": "active"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/cards/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/issuing/disputes', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/issuing/disputes')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/issuing/disputes', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/disputes')
            .send({
              "amount": 542,
              "evidence": {
                "canceled": {
                  "id": 626,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "fraudulent": {
                  "id": 591,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "merchandise_not_as_described": {
                  "id": 32,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "not_received": {
                  "id": 214,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "other": {
                  "id": 641,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "service_not_as_described": {
                  "id": 760,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                }
              },
              "expand": [
                "Generated Value",
                "API Test Data"
              ],
              "metadata": {},
              "transaction": "API Test Data",
              "treasury": {
                "received_debit": "Generated Value"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/disputes')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/issuing/disputes/{dispute}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/issuing/disputes/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/issuing/disputes/{dispute}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/disputes/Test String')
            .send({
              "evidence": {
                "canceled": {
                  "id": 345,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "duplicate": {
                  "id": 281,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "merchandise_not_as_described": {
                  "id": 809,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "not_received": {
                  "id": 731,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "other": {
                  "id": 160,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "service_not_as_described": {
                  "id": 489,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                }
              },
              "metadata": {
                "id": 86,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.917Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/disputes/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/issuing/disputes/{dispute}/submit', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/disputes/Sample Data/submit')
            .send({
              "expand": [
                "API Test Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/disputes/Sample Data/submit')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/issuing/personalization_designs', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/issuing/personalization_designs')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/issuing/personalization_designs', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/personalization_designs')
            .send({
              "carrier_text": {
                "footer_body": {
                  "id": 834,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "footer_title": {
                  "id": 862,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                }
              },
              "expand": [
                "API Test Data",
                "Generated Value",
                "Sample Data"
              ],
              "lookup_key": "Test String",
              "metadata": {},
              "name": "Generated Value",
              "physical_bundle": "Test String",
              "preferences": {
                "is_default": false
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/personalization_designs')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/issuing/personalization_designs/{personalization_design}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/issuing/personalization_designs/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/issuing/personalization_designs/{personalization_design}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/personalization_designs/API Test Data')
            .send({
              "card_logo": {
                "id": 250,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.917Z"
              },
              "carrier_text": {
                "id": 169,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.917Z"
              },
              "expand": [
                "Sample Data",
                "Sample Data"
              ],
              "lookup_key": {
                "id": 319,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.917Z"
              },
              "name": {
                "id": 786,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.917Z"
              },
              "physical_bundle": "Generated Value",
              "transfer_lookup_key": false
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/personalization_designs/API Test Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/issuing/physical_bundles', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/issuing/physical_bundles')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/issuing/physical_bundles/{physical_bundle}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/issuing/physical_bundles/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/issuing/settlements/{settlement}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/issuing/settlements/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/issuing/settlements/{settlement}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/settlements/API Test Data')
            .send({
              "expand": [
                "API Test Data",
                "API Test Data"
              ],
              "metadata": {}
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/settlements/API Test Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/issuing/tokens', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/issuing/tokens')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/issuing/tokens/{token}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/issuing/tokens/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/issuing/tokens/{token}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/tokens/Test String')
            .send({
              "expand": [
                "Test String",
                "Generated Value",
                "API Test Data"
              ],
              "status": "suspended"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/tokens/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/issuing/transactions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/issuing/transactions')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/issuing/transactions/{transaction}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/issuing/transactions/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/issuing/transactions/{transaction}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/transactions/Test String')
            .send({
              "expand": [
                "Test String",
                "Sample Data"
              ],
              "metadata": {
                "id": 809,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.917Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/issuing/transactions/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/link_account_sessions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/link_account_sessions')
            .send({
              "account_holder": {
                "customer": "Sample Data",
                "type": "customer"
              },
              "filters": {
                "countries": [
                  "Sample Data",
                  "Test String"
                ]
              },
              "permissions": [
                "payment_method",
                "transactions"
              ],
              "return_url": "Generated Value"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/link_account_sessions')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/link_account_sessions/{session}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/link_account_sessions/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/linked_accounts', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/linked_accounts')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/linked_accounts/{account}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/linked_accounts/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/linked_accounts/{account}/disconnect', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/linked_accounts/Generated Value/disconnect')
            .send({
              "expand": [
                "Generated Value",
                "Sample Data",
                "Generated Value"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/linked_accounts/Generated Value/disconnect')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/linked_accounts/{account}/owners', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/linked_accounts/Sample Data/owners')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/linked_accounts/{account}/refresh', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/linked_accounts/Sample Data/refresh')
            .send({
              "expand": [
                "Generated Value"
              ],
              "features": [
                "transactions",
                "transactions",
                "balance"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/linked_accounts/Sample Data/refresh')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/mandates/{mandate}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/mandates/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/payment_intents', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/payment_intents')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/payment_intents', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_intents')
            .send({
              "amount": 69,
              "application_fee_amount": 401,
              "capture_method": "automatic_async",
              "confirm": true,
              "confirmation_token": "Generated Value",
              "currency": "Sample Data",
              "description": "API Test Data",
              "expand": [
                "API Test Data",
                "Generated Value",
                "Sample Data"
              ],
              "mandate_data": {
                "id": 549,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.917Z"
              },
              "metadata": {},
              "off_session": {
                "id": 978,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.917Z"
              },
              "on_behalf_of": "Test String",
              "payment_method": "Sample Data",
              "payment_method_options": {
                "acss_debit": {
                  "id": 184,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "afterpay_clearpay": {
                  "id": 108,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "alipay": {
                  "id": 820,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "au_becs_debit": {
                  "id": 80,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "blik": {
                  "id": 853,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "boleto": {
                  "id": 223,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "card": {
                  "id": 59,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "card_present": {
                  "id": 553,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "cashapp": {
                  "id": 314,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "crypto": {
                  "id": 611,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "customer_balance": {
                  "id": 47,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "eps": {
                  "id": 832,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "fpx": {
                  "id": 378,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "giropay": {
                  "id": 561,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "grabpay": {
                  "id": 215,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "ideal": {
                  "id": 367,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "interac_present": {
                  "id": 227,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "kakao_pay": {
                  "id": 693,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "klarna": {
                  "id": 746,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "konbini": {
                  "id": 445,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "kr_card": {
                  "id": 836,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "multibanco": {
                  "id": 962,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "nz_bank_account": {
                  "id": 552,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "oxxo": {
                  "id": 899,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "p24": {
                  "id": 466,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "pay_by_bank": {
                  "id": 667,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "paynow": {
                  "id": 92,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "paypal": {
                  "id": 98,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "pix": {
                  "id": 19,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "promptpay": {
                  "id": 198,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "revolut_pay": {
                  "id": 469,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "samsung_pay": {
                  "id": 431,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "satispay": {
                  "id": 955,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "sofort": {
                  "id": 516,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "twint": {
                  "id": 580,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "wechat_pay": {
                  "id": 740,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                },
                "zip": {
                  "id": 942,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.917Z"
                }
              },
              "payment_method_types": [
                "Sample Data"
              ],
              "receipt_email": "Sample Data",
              "return_url": "Test String",
              "setup_future_usage": "off_session",
              "shipping": {
                "address": {
                  "city": "API Test Data",
                  "country": "Test String",
                  "line2": "Generated Value",
                  "state": "Sample Data"
                },
                "name": "Sample Data",
                "phone": "Test String",
                "tracking_number": "API Test Data"
              },
              "statement_descriptor_suffix": "Test String",
              "transfer_data": {
                "amount": 274,
                "destination": "Sample Data"
              },
              "use_stripe_sdk": false
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_intents')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/payment_intents/search', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/payment_intents/search')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/payment_intents/{intent}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/payment_intents/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/payment_intents/{intent}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_intents/Sample Data')
            .send({
              "amount": 539,
              "capture_method": "automatic",
              "currency": "API Test Data",
              "expand": [
                "Test String"
              ],
              "metadata": {
                "id": 148,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.917Z"
              },
              "payment_method": "Generated Value",
              "payment_method_data": {
                "acss_debit": {
                  "account_number": "API Test Data",
                  "institution_number": "API Test Data",
                  "transit_number": "Generated Value"
                },
                "amazon_pay": {},
                "bacs_debit": {
                  "account_number": "Generated Value",
                  "sort_code": "Generated Value"
                },
                "bancontact": {},
                "billie": {},
                "billing_details": {
                  "address": {
                    "id": 78,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.917Z"
                  },
                  "email": {
                    "id": 998,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.917Z"
                  },
                  "name": {
                    "id": 757,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.917Z"
                  },
                  "tax_id": "Generated Value"
                },
                "blik": {},
                "crypto": {},
                "eps": {
                  "bank": "vr_bank_braunau"
                },
                "fpx": {
                  "bank": "public_bank"
                },
                "giropay": {},
                "grabpay": {},
                "ideal": {},
                "interac_present": {},
                "klarna": {},
                "konbini": {},
                "link": {},
                "metadata": {},
                "multibanco": {},
                "oxxo": {},
                "pay_by_bank": {},
                "payco": {},
                "paynow": {},
                "paypal": {},
                "radar_options": {
                  "session": "Generated Value"
                },
                "revolut_pay": {},
                "samsung_pay": {},
                "satispay": {},
                "sepa_debit": {
                  "iban": "Sample Data"
                },
                "swish": {},
                "twint": {},
                "type": "sepa_debit",
                "us_bank_account": {
                  "account_holder_type": "individual",
                  "account_number": "Sample Data",
                  "account_type": "checking",
                  "financial_connections_account": "Test String",
                  "routing_number": "Test String"
                },
                "zip": {}
              },
              "receipt_email": {
                "id": 614,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.917Z"
              },
              "setup_future_usage": "off_session",
              "shipping": {
                "id": 115,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.917Z"
              },
              "transfer_data": {
                "amount": 472
              },
              "transfer_group": "Generated Value"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_intents/Sample Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/payment_intents/{intent}/apply_customer_balance', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_intents/Test String/apply_customer_balance')
            .send({
              "amount": 555,
              "currency": "Generated Value"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_intents/Test String/apply_customer_balance')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/payment_intents/{intent}/cancel', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_intents/Generated Value/cancel')
            .send({
              "cancellation_reason": "abandoned",
              "expand": [
                "Sample Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_intents/Generated Value/cancel')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/payment_intents/{intent}/capture', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_intents/Sample Data/capture')
            .send({
              "application_fee_amount": 357,
              "expand": [
                "Generated Value",
                "API Test Data",
                "Generated Value"
              ],
              "final_capture": false,
              "metadata": {
                "id": 992,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.917Z"
              },
              "statement_descriptor": "Generated Value"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_intents/Sample Data/capture')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/payment_intents/{intent}/confirm', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_intents/API Test Data/confirm')
            .send({
              "client_secret": "API Test Data",
              "confirmation_token": "Test String",
              "expand": [
                "Test String",
                "API Test Data"
              ],
              "mandate": "Test String",
              "off_session": {
                "id": 346,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.917Z"
              },
              "radar_options": {
                "session": "Generated Value"
              },
              "receipt_email": {
                "id": 259,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.917Z"
              },
              "return_url": "API Test Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_intents/API Test Data/confirm')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/payment_intents/{intent}/increment_authorization', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_intents/API Test Data/increment_authorization')
            .send({
              "amount": 735,
              "description": "API Test Data",
              "metadata": {},
              "statement_descriptor": "API Test Data",
              "transfer_data": {}
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_intents/API Test Data/increment_authorization')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/payment_intents/{intent}/verify_microdeposits', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_intents/Sample Data/verify_microdeposits')
            .send({
              "amounts": [
                120
              ],
              "client_secret": "Test String",
              "descriptor_code": "Sample Data",
              "expand": [
                "API Test Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_intents/Sample Data/verify_microdeposits')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/payment_links', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/payment_links')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/payment_links', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_links')
            .send({
              "after_completion": {
                "redirect": {
                  "url": "Sample Data"
                },
                "type": "hosted_confirmation"
              },
              "allow_promotion_codes": false,
              "application_fee_amount": 305,
              "application_fee_percent": 339.41,
              "automatic_tax": {
                "enabled": false,
                "liability": {
                  "account": "Generated Value",
                  "type": "account"
                }
              },
              "billing_address_collection": "required",
              "currency": "Test String",
              "custom_text": {
                "after_submit": {
                  "id": 277,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.918Z"
                },
                "shipping_address": {
                  "id": 422,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.918Z"
                },
                "terms_of_service_acceptance": {
                  "id": 806,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.918Z"
                }
              },
              "inactive_message": "Sample Data",
              "invoice_creation": {
                "enabled": true
              },
              "line_items": [
                {
                  "adjustable_quantity": {
                    "enabled": false,
                    "maximum": 228
                  },
                  "quantity": 322
                }
              ],
              "on_behalf_of": "Sample Data",
              "payment_intent_data": {
                "description": "API Test Data",
                "metadata": {},
                "statement_descriptor": "Generated Value",
                "statement_descriptor_suffix": "Sample Data"
              },
              "payment_method_collection": "if_required",
              "payment_method_types": [
                "sofort",
                "affirm",
                "p24"
              ],
              "restrictions": {
                "completed_sessions": {
                  "limit": 141
                }
              },
              "shipping_address_collection": {
                "allowed_countries": [
                  "DZ",
                  "CW",
                  "CW"
                ]
              },
              "shipping_options": [
                {
                  "shipping_rate": "Test String"
                },
                {
                  "shipping_rate": "Test String"
                },
                {}
              ],
              "submit_type": "book",
              "subscription_data": {
                "description": "Test String",
                "metadata": {},
                "trial_period_days": 824,
                "trial_settings": {
                  "end_behavior": {
                    "missing_payment_method": "pause"
                  }
                }
              },
              "transfer_data": {
                "amount": 717,
                "destination": "API Test Data"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_links')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/payment_links/{payment_link}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/payment_links/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/payment_links/{payment_link}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_links/Generated Value')
            .send({
              "active": true,
              "allow_promotion_codes": false,
              "customer_creation": "if_required",
              "expand": [
                "Generated Value",
                "Sample Data"
              ],
              "inactive_message": {
                "id": 145,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.918Z"
              },
              "invoice_creation": {
                "enabled": false,
                "invoice_data": {
                  "custom_fields": {
                    "id": 370,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.918Z"
                  },
                  "footer": "API Test Data",
                  "issuer": {
                    "account": "Generated Value",
                    "type": "self"
                  },
                  "metadata": {
                    "id": 353,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.918Z"
                  },
                  "rendering_options": {
                    "id": 447,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.918Z"
                  }
                }
              },
              "line_items": [
                {
                  "adjustable_quantity": {
                    "enabled": true
                  },
                  "id": "Generated Value",
                  "quantity": 153
                },
                {
                  "id": "Generated Value",
                  "quantity": 85
                }
              ],
              "metadata": {},
              "payment_intent_data": {
                "description": {
                  "id": 902,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.918Z"
                },
                "metadata": {
                  "id": 828,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.918Z"
                },
                "statement_descriptor": {
                  "id": 38,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.918Z"
                },
                "statement_descriptor_suffix": {
                  "id": 770,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.918Z"
                }
              },
              "phone_number_collection": {
                "enabled": false
              },
              "restrictions": {
                "id": 408,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.918Z"
              },
              "shipping_address_collection": {
                "id": 772,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.918Z"
              },
              "submit_type": "book",
              "subscription_data": {
                "invoice_settings": {},
                "metadata": {
                  "id": 436,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.918Z"
                },
                "trial_period_days": {
                  "id": 175,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.918Z"
                },
                "trial_settings": {
                  "id": 501,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.918Z"
                }
              },
              "tax_id_collection": {
                "enabled": false,
                "required": "if_supported"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_links/Generated Value')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/payment_links/{payment_link}/line_items', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/payment_links/Sample Data/line_items')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/payment_method_configurations', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/payment_method_configurations')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/payment_method_configurations', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_method_configurations')
            .send({
              "affirm": {},
              "afterpay_clearpay": {
                "display_preference": {}
              },
              "alipay": {
                "display_preference": {
                  "preference": "on"
                }
              },
              "alma": {
                "display_preference": {
                  "preference": "off"
                }
              },
              "apple_pay": {
                "display_preference": {
                  "preference": "none"
                }
              },
              "apple_pay_later": {
                "display_preference": {}
              },
              "au_becs_debit": {
                "display_preference": {}
              },
              "bancontact": {
                "display_preference": {
                  "preference": "on"
                }
              },
              "billie": {
                "display_preference": {
                  "preference": "none"
                }
              },
              "boleto": {
                "display_preference": {
                  "preference": "off"
                }
              },
              "card": {},
              "cartes_bancaires": {
                "display_preference": {
                  "preference": "on"
                }
              },
              "cashapp": {
                "display_preference": {
                  "preference": "on"
                }
              },
              "eps": {},
              "expand": [
                "Generated Value",
                "API Test Data"
              ],
              "fpx": {
                "display_preference": {
                  "preference": "off"
                }
              },
              "giropay": {
                "display_preference": {
                  "preference": "none"
                }
              },
              "google_pay": {
                "display_preference": {
                  "preference": "none"
                }
              },
              "grabpay": {
                "display_preference": {
                  "preference": "none"
                }
              },
              "kakao_pay": {
                "display_preference": {
                  "preference": "off"
                }
              },
              "klarna": {
                "display_preference": {}
              },
              "konbini": {
                "display_preference": {
                  "preference": "off"
                }
              },
              "kr_card": {
                "display_preference": {
                  "preference": "on"
                }
              },
              "link": {
                "display_preference": {}
              },
              "name": "API Test Data",
              "naver_pay": {
                "display_preference": {
                  "preference": "off"
                }
              },
              "nz_bank_account": {
                "display_preference": {
                  "preference": "none"
                }
              },
              "oxxo": {
                "display_preference": {
                  "preference": "none"
                }
              },
              "p24": {
                "display_preference": {
                  "preference": "on"
                }
              },
              "parent": "Sample Data",
              "payco": {},
              "paynow": {
                "display_preference": {
                  "preference": "on"
                }
              },
              "paypal": {},
              "pix": {
                "display_preference": {
                  "preference": "on"
                }
              },
              "promptpay": {
                "display_preference": {}
              },
              "revolut_pay": {
                "display_preference": {}
              },
              "samsung_pay": {},
              "satispay": {},
              "sepa_debit": {
                "display_preference": {
                  "preference": "on"
                }
              },
              "sofort": {
                "display_preference": {
                  "preference": "none"
                }
              },
              "swish": {
                "display_preference": {
                  "preference": "none"
                }
              },
              "twint": {},
              "wechat_pay": {},
              "zip": {}
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_method_configurations')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/payment_method_configurations/{configuration}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/payment_method_configurations/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/payment_method_configurations/{configuration}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_method_configurations/Generated Value')
            .send({
              "acss_debit": {
                "display_preference": {
                  "preference": "on"
                }
              },
              "active": true,
              "affirm": {
                "display_preference": {
                  "preference": "none"
                }
              },
              "afterpay_clearpay": {
                "display_preference": {
                  "preference": "on"
                }
              },
              "alipay": {
                "display_preference": {}
              },
              "alma": {
                "display_preference": {
                  "preference": "none"
                }
              },
              "amazon_pay": {},
              "apple_pay": {
                "display_preference": {
                  "preference": "none"
                }
              },
              "apple_pay_later": {},
              "au_becs_debit": {
                "display_preference": {
                  "preference": "on"
                }
              },
              "bacs_debit": {
                "display_preference": {
                  "preference": "off"
                }
              },
              "billie": {
                "display_preference": {
                  "preference": "off"
                }
              },
              "blik": {},
              "card": {},
              "cartes_bancaires": {
                "display_preference": {
                  "preference": "none"
                }
              },
              "cashapp": {
                "display_preference": {}
              },
              "customer_balance": {
                "display_preference": {
                  "preference": "off"
                }
              },
              "eps": {
                "display_preference": {
                  "preference": "on"
                }
              },
              "fpx": {
                "display_preference": {
                  "preference": "on"
                }
              },
              "google_pay": {
                "display_preference": {
                  "preference": "none"
                }
              },
              "grabpay": {
                "display_preference": {
                  "preference": "none"
                }
              },
              "jcb": {
                "display_preference": {
                  "preference": "none"
                }
              },
              "klarna": {},
              "konbini": {
                "display_preference": {}
              },
              "kr_card": {},
              "link": {
                "display_preference": {}
              },
              "mobilepay": {},
              "nz_bank_account": {},
              "pay_by_bank": {},
              "payco": {
                "display_preference": {
                  "preference": "on"
                }
              },
              "paynow": {
                "display_preference": {}
              },
              "promptpay": {
                "display_preference": {
                  "preference": "on"
                }
              },
              "revolut_pay": {},
              "sepa_debit": {},
              "sofort": {},
              "swish": {
                "display_preference": {
                  "preference": "on"
                }
              },
              "twint": {
                "display_preference": {
                  "preference": "off"
                }
              },
              "us_bank_account": {
                "display_preference": {
                  "preference": "none"
                }
              },
              "wechat_pay": {
                "display_preference": {}
              },
              "zip": {
                "display_preference": {
                  "preference": "off"
                }
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_method_configurations/Generated Value')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/payment_method_domains', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/payment_method_domains')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/payment_method_domains', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_method_domains')
            .send({
              "domain_name": "Test String",
              "enabled": false,
              "expand": [
                "API Test Data",
                "Generated Value"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_method_domains')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/payment_method_domains/{payment_method_domain}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/payment_method_domains/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/payment_method_domains/{payment_method_domain}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_method_domains/Generated Value')
            .send({
              "enabled": false,
              "expand": [
                "Sample Data",
                "API Test Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_method_domains/Generated Value')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/payment_method_domains/{payment_method_domain}/validate', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_method_domains/API Test Data/validate')
            .send({})
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_method_domains/API Test Data/validate')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/payment_methods', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/payment_methods')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/payment_methods', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_methods')
            .send({
              "acss_debit": {
                "account_number": "Test String",
                "institution_number": "API Test Data",
                "transit_number": "Sample Data"
              },
              "afterpay_clearpay": {},
              "alipay": {},
              "allow_redisplay": "unspecified",
              "amazon_pay": {},
              "au_becs_debit": {
                "account_number": "Generated Value",
                "bsb_number": "Test String"
              },
              "bacs_debit": {
                "account_number": "Sample Data"
              },
              "bancontact": {},
              "billie": {},
              "boleto": {
                "tax_id": "Sample Data"
              },
              "card": {
                "id": 302,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.918Z"
              },
              "cashapp": {},
              "customer_balance": {},
              "eps": {
                "bank": "oberbank_ag"
              },
              "fpx": {
                "bank": "ocbc"
              },
              "giropay": {},
              "grabpay": {},
              "interac_present": {},
              "kakao_pay": {},
              "klarna": {
                "dob": {
                  "day": 493,
                  "month": 394,
                  "year": 550
                }
              },
              "mobilepay": {},
              "multibanco": {},
              "naver_pay": {
                "funding": "card"
              },
              "nz_bank_account": {
                "account_number": "API Test Data",
                "bank_code": "API Test Data",
                "branch_code": "API Test Data",
                "reference": "Sample Data",
                "suffix": "Generated Value"
              },
              "oxxo": {},
              "p24": {
                "bank": "pbac_z_ipko"
              },
              "pay_by_bank": {},
              "payco": {},
              "payment_method": "Generated Value",
              "paynow": {},
              "paypal": {},
              "promptpay": {},
              "revolut_pay": {},
              "samsung_pay": {},
              "sepa_debit": {
                "iban": "Test String"
              },
              "swish": {},
              "twint": {},
              "type": "satispay",
              "us_bank_account": {
                "account_number": "Sample Data"
              },
              "wechat_pay": {}
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_methods')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/payment_methods/{payment_method}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/payment_methods/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/payment_methods/{payment_method}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_methods/Generated Value')
            .send({
              "allow_redisplay": "unspecified",
              "billing_details": {
                "name": {
                  "id": 899,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.918Z"
                },
                "phone": {
                  "id": 789,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.918Z"
                },
                "tax_id": "API Test Data"
              },
              "expand": [
                "API Test Data",
                "Test String",
                "Sample Data"
              ],
              "link": {},
              "metadata": {
                "id": 169,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.918Z"
              },
              "pay_by_bank": {},
              "us_bank_account": {
                "account_holder_type": "individual"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_methods/Generated Value')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/payment_methods/{payment_method}/attach', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_methods/Test String/attach')
            .send({
              "customer": "API Test Data",
              "expand": [
                "Test String",
                "Test String"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_methods/Test String/attach')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/payment_methods/{payment_method}/detach', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_methods/Sample Data/detach')
            .send({
              "expand": [
                "Generated Value"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payment_methods/Sample Data/detach')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/payouts', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/payouts')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/payouts', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payouts')
            .send({
              "amount": 43,
              "currency": "Test String",
              "metadata": {}
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payouts')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/payouts/{payout}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/payouts/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/payouts/{payout}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payouts/Sample Data')
            .send({
              "expand": [
                "Generated Value"
              ],
              "metadata": {
                "id": 972,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.918Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payouts/Sample Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/payouts/{payout}/cancel', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payouts/Generated Value/cancel')
            .send({
              "expand": [
                "Generated Value"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payouts/Generated Value/cancel')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/payouts/{payout}/reverse', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/payouts/Test String/reverse')
            .send({
              "expand": [
                "Test String",
                "Generated Value",
                "Generated Value"
              ],
              "metadata": {}
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/payouts/Test String/reverse')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/plans', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/plans')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/plans', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/plans')
            .send({
              "amount_decimal": "Sample Data",
              "currency": "Generated Value",
              "expand": [
                "API Test Data",
                "Test String"
              ],
              "interval": "month",
              "interval_count": 358,
              "metadata": {
                "id": 447,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.918Z"
              },
              "meter": "Generated Value",
              "nickname": "Test String",
              "product": {
                "id": 504,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.918Z"
              },
              "tiers": [
                {
                  "flat_amount": 369,
                  "flat_amount_decimal": "Test String",
                  "unit_amount": 71,
                  "up_to": {
                    "id": 711,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.918Z"
                  }
                },
                {
                  "flat_amount": 585,
                  "unit_amount_decimal": "Generated Value",
                  "up_to": {
                    "id": 912,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.918Z"
                  }
                },
                {
                  "flat_amount_decimal": "API Test Data",
                  "unit_amount": 855,
                  "unit_amount_decimal": "Sample Data",
                  "up_to": {
                    "id": 645,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.918Z"
                  }
                }
              ],
              "tiers_mode": "volume",
              "transform_usage": {
                "divide_by": 25,
                "round": "down"
              },
              "trial_period_days": 137,
              "usage_type": "licensed"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/plans')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/plans/{plan}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/plans/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/plans/{plan}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/plans/Generated Value')
            .send({
              "active": false,
              "expand": [
                "Sample Data",
                "Sample Data",
                "API Test Data"
              ],
              "product": "API Test Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/plans/Generated Value')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/plans/{plan}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/plans/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/prices', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/prices')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/prices', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/prices')
            .send({
              "active": false,
              "currency": "API Test Data",
              "custom_unit_amount": {
                "enabled": false,
                "minimum": 443,
                "preset": 501
              },
              "expand": [
                "Sample Data",
                "Test String"
              ],
              "lookup_key": "Test String",
              "metadata": {},
              "product": "Sample Data",
              "product_data": {
                "id": "API Test Data",
                "metadata": {},
                "name": "Generated Value",
                "statement_descriptor": "Test String",
                "unit_label": "Generated Va"
              },
              "recurring": {
                "interval": "year"
              },
              "tax_behavior": "exclusive",
              "tiers_mode": "graduated",
              "unit_amount": 811,
              "unit_amount_decimal": "API Test Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/prices')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/prices/search', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/prices/search')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/prices/{price}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/prices/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/prices/{price}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/prices/Test String')
            .send({
              "nickname": "Test String",
              "transfer_lookup_key": false
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/prices/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/products', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/products')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/products', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/products')
            .send({
              "active": true,
              "marketing_features": [
                {
                  "name": "API Test Data"
                },
                {
                  "name": "Generated Value"
                }
              ],
              "metadata": {},
              "name": "Generated Value",
              "package_dimensions": {
                "height": 332.17,
                "length": 290.14,
                "weight": 93.77,
                "width": 775.88
              },
              "shippable": true,
              "unit_label": "API Test Dat"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/products')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/products/search', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/products/search')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/products/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/products/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/products/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/products/Test String')
            .send({
              "active": true,
              "default_price": "Generated Value",
              "description": {
                "id": 49,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.919Z"
              },
              "name": "Test String",
              "package_dimensions": {
                "id": 485,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.919Z"
              },
              "shippable": false,
              "statement_descriptor": "Test String",
              "tax_code": {
                "id": 295,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.919Z"
              },
              "url": {
                "id": 580,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.919Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/products/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/products/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/products/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/products/{product}/features', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/products/Generated Value/features')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/products/{product}/features', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/products/Test String/features')
            .send({
              "entitlement_feature": "API Test Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/products/Test String/features')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/products/{product}/features/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/products/API Test Data/features/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('DELETE /v1/products/{product}/features/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/products/Generated Value/features/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/promotion_codes', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/promotion_codes')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/promotion_codes', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/promotion_codes')
            .send({
              "active": true,
              "code": "API Test Data",
              "coupon": "Generated Value",
              "customer": "API Test Data",
              "expand": [
                "Generated Value",
                "Generated Value"
              ],
              "metadata": {},
              "restrictions": {
                "currency_options": {},
                "first_time_transaction": false,
                "minimum_amount": 658,
                "minimum_amount_currency": "Test String"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/promotion_codes')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/promotion_codes/{promotion_code}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/promotion_codes/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/promotion_codes/{promotion_code}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/promotion_codes/Sample Data')
            .send({
              "expand": [
                "Test String",
                "Sample Data",
                "Sample Data"
              ],
              "restrictions": {
                "currency_options": {}
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/promotion_codes/Sample Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/quotes', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/quotes')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/quotes', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/quotes')
            .send({
              "application_fee_amount": {
                "id": 468,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.919Z"
              },
              "application_fee_percent": {
                "id": 544,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.919Z"
              },
              "automatic_tax": {
                "enabled": false
              },
              "collection_method": "send_invoice",
              "customer": "Generated Value",
              "default_tax_rates": {
                "id": 940,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.919Z"
              },
              "description": {
                "id": 821,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.919Z"
              },
              "discounts": {
                "id": 151,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.919Z"
              },
              "expand": [
                "Generated Value",
                "Generated Value",
                "Sample Data"
              ],
              "expires_at": 523,
              "footer": {
                "id": 461,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.919Z"
              },
              "on_behalf_of": {
                "id": 170,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.919Z"
              },
              "subscription_data": {
                "billing_mode": {
                  "type": "flexible"
                },
                "description": "Sample Data",
                "trial_period_days": {
                  "id": 706,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.919Z"
                }
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/quotes')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/quotes/{quote}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/quotes/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/quotes/{quote}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/quotes/Test String')
            .send({
              "application_fee_amount": {
                "id": 557,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.919Z"
              },
              "collection_method": "send_invoice",
              "customer": "Sample Data",
              "default_tax_rates": {
                "id": 401,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.919Z"
              },
              "description": {
                "id": 814,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.919Z"
              },
              "discounts": {
                "id": 287,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.919Z"
              },
              "expires_at": 21,
              "footer": {
                "id": 580,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.919Z"
              },
              "invoice_settings": {
                "days_until_due": 288
              },
              "line_items": [
                {
                  "id": "Generated Value",
                  "price": "API Test Data",
                  "price_data": {
                    "currency": "API Test Data",
                    "product": "API Test Data",
                    "recurring": {
                      "interval": "month",
                      "interval_count": 962
                    }
                  },
                  "quantity": 540,
                  "tax_rates": {
                    "id": 977,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.919Z"
                  }
                },
                {
                  "id": "Sample Data",
                  "price": "Generated Value",
                  "price_data": {
                    "currency": "Sample Data",
                    "product": "Generated Value",
                    "recurring": {
                      "interval": "month",
                      "interval_count": 787
                    },
                    "tax_behavior": "exclusive",
                    "unit_amount": 433,
                    "unit_amount_decimal": "Generated Value"
                  },
                  "quantity": 460,
                  "tax_rates": {
                    "id": 631,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.919Z"
                  }
                },
                {
                  "discounts": {
                    "id": 928,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.919Z"
                  },
                  "price_data": {
                    "currency": "API Test Data",
                    "product": "Generated Value",
                    "recurring": {
                      "interval": "week",
                      "interval_count": 435
                    },
                    "tax_behavior": "inclusive",
                    "unit_amount": 742,
                    "unit_amount_decimal": "Sample Data"
                  },
                  "quantity": 679,
                  "tax_rates": {
                    "id": 811,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.919Z"
                  }
                }
              ],
              "metadata": {},
              "on_behalf_of": {
                "id": 202,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.919Z"
              },
              "subscription_data": {
                "trial_period_days": {
                  "id": 360,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.919Z"
                }
              },
              "transfer_data": {
                "id": 477,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.919Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/quotes/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/quotes/{quote}/accept', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/quotes/API Test Data/accept')
            .send({})
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/quotes/API Test Data/accept')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/quotes/{quote}/cancel', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/quotes/API Test Data/cancel')
            .send({
              "expand": [
                "Test String"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/quotes/API Test Data/cancel')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/quotes/{quote}/computed_upfront_line_items', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/quotes/Generated Value/computed_upfront_line_items')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/quotes/{quote}/finalize', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/quotes/API Test Data/finalize')
            .send({
              "expand": [
                "API Test Data",
                "Test String"
              ],
              "expires_at": 384
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/quotes/API Test Data/finalize')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/quotes/{quote}/line_items', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/quotes/Test String/line_items')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/quotes/{quote}/pdf', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/quotes/Test String/pdf')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/radar/early_fraud_warnings', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/radar/early_fraud_warnings')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/radar/early_fraud_warnings/{early_fraud_warning}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/radar/early_fraud_warnings/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/radar/value_list_items', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/radar/value_list_items')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/radar/value_list_items', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/radar/value_list_items')
            .send({
              "expand": [
                "Test String",
                "Sample Data",
                "Sample Data"
              ],
              "value": "API Test Data",
              "value_list": "Sample Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/radar/value_list_items')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/radar/value_list_items/{item}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/radar/value_list_items/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('DELETE /v1/radar/value_list_items/{item}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/radar/value_list_items/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/radar/value_lists', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/radar/value_lists')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/radar/value_lists', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/radar/value_lists')
            .send({
              "alias": "API Test Data",
              "expand": [
                "Generated Value",
                "API Test Data"
              ],
              "item_type": "card_bin",
              "metadata": {},
              "name": "Test String"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/radar/value_lists')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/radar/value_lists/{value_list}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/radar/value_lists/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/radar/value_lists/{value_list}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/radar/value_lists/Generated Value')
            .send({
              "alias": "API Test Data",
              "expand": [
                "Sample Data"
              ],
              "metadata": {}
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/radar/value_lists/Generated Value')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/radar/value_lists/{value_list}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/radar/value_lists/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/refunds', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/refunds')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/refunds', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/refunds')
            .send({
              "amount": 337,
              "currency": "API Test Data",
              "customer": "Test String",
              "instructions_email": "Sample Data",
              "origin": "customer_balance",
              "reason": "duplicate",
              "refund_application_fee": true,
              "reverse_transfer": true
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/refunds')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/refunds/{refund}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/refunds/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/refunds/{refund}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/refunds/API Test Data')
            .send({
              "expand": [
                "API Test Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/refunds/API Test Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/refunds/{refund}/cancel', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/refunds/Test String/cancel')
            .send({})
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/refunds/Test String/cancel')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/reporting/report_runs', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/reporting/report_runs')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/reporting/report_runs', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/reporting/report_runs')
            .send({
              "expand": [
                "Generated Value"
              ],
              "parameters": {
                "connected_account": "API Test Data",
                "currency": "Generated Value",
                "interval_start": 109,
                "reporting_category": "refund"
              },
              "report_type": "Generated Value"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/reporting/report_runs')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/reporting/report_runs/{report_run}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/reporting/report_runs/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/reporting/report_types', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/reporting/report_types')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/reporting/report_types/{report_type}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/reporting/report_types/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/reviews', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/reviews')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/reviews/{review}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/reviews/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/reviews/{review}/approve', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/reviews/Sample Data/approve')
            .send({})
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/reviews/Sample Data/approve')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/setup_attempts', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/setup_attempts')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/setup_intents', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/setup_intents')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/setup_intents', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/setup_intents')
            .send({
              "automatic_payment_methods": {
                "allow_redirects": "always",
                "enabled": true
              },
              "confirm": false,
              "confirmation_token": "API Test Data",
              "customer": "Generated Value",
              "description": "API Test Data",
              "expand": [
                "Test String"
              ],
              "flow_directions": [
                "inbound",
                "inbound"
              ],
              "mandate_data": {
                "id": 687,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.919Z"
              },
              "metadata": {},
              "on_behalf_of": "API Test Data",
              "payment_method": "Test String",
              "payment_method_configuration": "API Test Data",
              "payment_method_data": {
                "acss_debit": {
                  "account_number": "Test String",
                  "institution_number": "Generated Value",
                  "transit_number": "Sample Data"
                },
                "afterpay_clearpay": {},
                "allow_redisplay": "unspecified",
                "alma": {},
                "amazon_pay": {},
                "au_becs_debit": {
                  "account_number": "API Test Data",
                  "bsb_number": "Sample Data"
                },
                "bacs_debit": {
                  "account_number": "API Test Data",
                  "sort_code": "Sample Data"
                },
                "billing_details": {
                  "address": {
                    "id": 226,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.919Z"
                  },
                  "email": {
                    "id": 851,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.919Z"
                  },
                  "tax_id": "Sample Data"
                },
                "blik": {},
                "boleto": {
                  "tax_id": "Generated Value"
                },
                "cashapp": {},
                "crypto": {},
                "eps": {
                  "bank": "arzte_und_apotheker_bank"
                },
                "giropay": {},
                "grabpay": {},
                "interac_present": {},
                "kakao_pay": {},
                "kr_card": {},
                "metadata": {},
                "nz_bank_account": {
                  "account_holder_name": "API Test Data",
                  "account_number": "API Test Data",
                  "bank_code": "API Test Data",
                  "branch_code": "API Test Data",
                  "reference": "Test String",
                  "suffix": "API Test Data"
                },
                "p24": {},
                "pay_by_bank": {},
                "payco": {},
                "paypal": {},
                "promptpay": {},
                "revolut_pay": {},
                "samsung_pay": {},
                "satispay": {},
                "swish": {},
                "type": "grabpay",
                "wechat_pay": {},
                "zip": {}
              },
              "payment_method_options": {
                "acss_debit": {
                  "currency": "cad",
                  "mandate_options": {
                    "custom_mandate_url": {
                      "id": 733,
                      "name": "Generated Test Data",
                      "status": "active",
                      "createdAt": "2025-08-14T09:47:07.919Z"
                    },
                    "default_for": [
                      "subscription"
                    ],
                    "payment_schedule": "interval",
                    "transaction_type": "business"
                  },
                  "verification_method": "automatic"
                },
                "bacs_debit": {
                  "mandate_options": {
                    "reference_prefix": {
                      "id": 5,
                      "name": "Generated Test Data",
                      "status": "active",
                      "createdAt": "2025-08-14T09:47:07.919Z"
                    }
                  }
                },
                "card": {
                  "mandate_options": {
                    "amount": 605,
                    "amount_type": "fixed",
                    "currency": "API Test Data",
                    "description": "Generated Value",
                    "end_date": 923,
                    "interval": "month",
                    "reference": "Test String",
                    "start_date": 923
                  },
                  "network": "cartes_bancaires",
                  "request_three_d_secure": "automatic",
                  "three_d_secure": {
                    "cryptogram": "Test String",
                    "electronic_commerce_indicator": "02",
                    "network_options": {
                      "cartes_bancaires": {
                        "cb_avalgo": "1",
                        "cb_score": 394
                      }
                    },
                    "transaction_id": "Generated Value",
                    "version": "2.2.0"
                  }
                },
                "card_present": {},
                "klarna": {
                  "on_demand": {
                    "maximum_amount": 966,
                    "minimum_amount": 789,
                    "purchase_interval": "month"
                  },
                  "preferred_locale": "fi-FI",
                  "subscriptions": {
                    "id": 28,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.919Z"
                  }
                },
                "link": {},
                "paypal": {
                  "billing_agreement_id": "API Test Data"
                },
                "sepa_debit": {
                  "mandate_options": {
                    "reference_prefix": {
                      "id": 739,
                      "name": "Generated Test Data",
                      "status": "active",
                      "createdAt": "2025-08-14T09:47:07.919Z"
                    }
                  }
                },
                "us_bank_account": {
                  "financial_connections": {
                    "filters": {
                      "account_subcategories": [
                        "savings",
                        "checking"
                      ]
                    },
                    "permissions": [
                      "transactions",
                      "payment_method"
                    ],
                    "prefetch": [
                      "balances",
                      "transactions"
                    ],
                    "return_url": "Test String"
                  },
                  "verification_method": "instant"
                }
              },
              "single_use": {
                "amount": 153,
                "currency": "API Test Data"
              },
              "use_stripe_sdk": true
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/setup_intents')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/setup_intents/{intent}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/setup_intents/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/setup_intents/{intent}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/setup_intents/API Test Data')
            .send({
              "attach_to_self": false,
              "customer": "Test String",
              "description": "Test String",
              "expand": [
                "Sample Data",
                "Test String"
              ],
              "flow_directions": [
                "inbound",
                "outbound"
              ],
              "metadata": {
                "id": 962,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.919Z"
              },
              "payment_method": "Test String",
              "payment_method_configuration": "Generated Value",
              "payment_method_data": {
                "acss_debit": {
                  "account_number": "Generated Value",
                  "institution_number": "Test String",
                  "transit_number": "Sample Data"
                },
                "affirm": {},
                "afterpay_clearpay": {},
                "bacs_debit": {
                  "account_number": "Test String",
                  "sort_code": "API Test Data"
                },
                "bancontact": {},
                "billing_details": {
                  "email": {
                    "id": 224,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.919Z"
                  },
                  "phone": {
                    "id": 386,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.919Z"
                  }
                },
                "boleto": {
                  "tax_id": "Sample Data"
                },
                "crypto": {},
                "eps": {
                  "bank": "bankhaus_schelhammer_und_schattera_ag"
                },
                "giropay": {},
                "interac_present": {},
                "kakao_pay": {},
                "klarna": {
                  "dob": {
                    "day": 263,
                    "month": 466,
                    "year": 59
                  }
                },
                "konbini": {},
                "link": {},
                "metadata": {},
                "mobilepay": {},
                "nz_bank_account": {
                  "account_holder_name": "API Test Data",
                  "account_number": "Test String",
                  "bank_code": "Generated Value",
                  "branch_code": "Generated Value",
                  "suffix": "Sample Data"
                },
                "p24": {},
                "pay_by_bank": {},
                "payco": {},
                "paynow": {},
                "paypal": {},
                "radar_options": {},
                "samsung_pay": {},
                "sepa_debit": {
                  "iban": "Sample Data"
                },
                "sofort": {
                  "country": "NL"
                },
                "twint": {},
                "type": "pix",
                "us_bank_account": {
                  "account_holder_type": "company",
                  "account_number": "API Test Data",
                  "account_type": "savings",
                  "financial_connections_account": "Generated Value"
                },
                "wechat_pay": {}
              },
              "payment_method_options": {
                "acss_debit": {
                  "currency": "cad",
                  "mandate_options": {
                    "custom_mandate_url": {
                      "id": 687,
                      "name": "Generated Test Data",
                      "status": "active",
                      "createdAt": "2025-08-14T09:47:07.919Z"
                    },
                    "default_for": [
                      "subscription",
                      "subscription",
                      "invoice"
                    ],
                    "payment_schedule": "combined"
                  }
                },
                "amazon_pay": {},
                "bacs_debit": {
                  "mandate_options": {
                    "reference_prefix": {
                      "id": 663,
                      "name": "Generated Test Data",
                      "status": "active",
                      "createdAt": "2025-08-14T09:47:07.919Z"
                    }
                  }
                },
                "card": {
                  "mandate_options": {
                    "amount": 229,
                    "amount_type": "maximum",
                    "currency": "Sample Data",
                    "interval": "year",
                    "interval_count": 146,
                    "reference": "Generated Value",
                    "start_date": 490,
                    "supported_types": [
                      "india"
                    ]
                  },
                  "network": "eftpos_au",
                  "request_three_d_secure": "challenge",
                  "three_d_secure": {
                    "cryptogram": "Generated Value",
                    "network_options": {
                      "cartes_bancaires": {
                        "cb_avalgo": "3",
                        "cb_exemption": "Gene"
                      }
                    },
                    "requestor_challenge_indicator": "Ge",
                    "transaction_id": "Test String",
                    "version": "1.0.2"
                  }
                },
                "card_present": {},
                "klarna": {
                  "currency": "Generated Value",
                  "on_demand": {
                    "average_amount": 178,
                    "maximum_amount": 807,
                    "minimum_amount": 64,
                    "purchase_interval": "week",
                    "purchase_interval_count": 804
                  },
                  "subscriptions": {
                    "id": 663,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.920Z"
                  }
                }
              },
              "payment_method_types": [
                "API Test Data",
                "Sample Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/setup_intents/API Test Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/setup_intents/{intent}/cancel', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/setup_intents/Generated Value/cancel')
            .send({})
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/setup_intents/Generated Value/cancel')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/setup_intents/{intent}/confirm', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/setup_intents/API Test Data/confirm')
            .send({
              "client_secret": "API Test Data",
              "confirmation_token": "Generated Value",
              "mandate_data": {
                "id": 710,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.920Z"
              },
              "payment_method": "Sample Data",
              "payment_method_data": {
                "acss_debit": {
                  "account_number": "Sample Data",
                  "institution_number": "Sample Data",
                  "transit_number": "Test String"
                },
                "afterpay_clearpay": {},
                "alipay": {},
                "allow_redisplay": "always",
                "bacs_debit": {
                  "sort_code": "API Test Data"
                },
                "bancontact": {},
                "blik": {},
                "boleto": {
                  "tax_id": "API Test Data"
                },
                "cashapp": {},
                "crypto": {},
                "eps": {},
                "fpx": {
                  "bank": "pb_enterprise"
                },
                "grabpay": {},
                "ideal": {
                  "bank": "sns_bank"
                },
                "interac_present": {},
                "kakao_pay": {},
                "konbini": {},
                "metadata": {},
                "naver_pay": {
                  "funding": "card"
                },
                "payco": {},
                "paynow": {},
                "paypal": {},
                "promptpay": {},
                "revolut_pay": {},
                "samsung_pay": {},
                "sofort": {
                  "country": "BE"
                },
                "twint": {},
                "type": "sofort",
                "us_bank_account": {
                  "account_holder_type": "individual",
                  "account_number": "API Test Data",
                  "financial_connections_account": "Sample Data",
                  "routing_number": "Test String"
                },
                "wechat_pay": {},
                "zip": {}
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/setup_intents/API Test Data/confirm')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/setup_intents/{intent}/verify_microdeposits', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/setup_intents/API Test Data/verify_microdeposits')
            .send({
              "amounts": [
                84
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/setup_intents/API Test Data/verify_microdeposits')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/shipping_rates', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/shipping_rates')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/shipping_rates', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/shipping_rates')
            .send({
              "delivery_estimate": {},
              "display_name": "Sample Data",
              "expand": [
                "Generated Value",
                "Test String"
              ],
              "fixed_amount": {
                "amount": 359,
                "currency": "Sample Data",
                "currency_options": {}
              },
              "metadata": {},
              "tax_behavior": "inclusive",
              "type": "fixed_amount"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/shipping_rates')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/shipping_rates/{shipping_rate_token}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/shipping_rates/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/shipping_rates/{shipping_rate_token}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/shipping_rates/Sample Data')
            .send({
              "expand": [
                "API Test Data"
              ],
              "metadata": {
                "id": 538,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.920Z"
              },
              "tax_behavior": "unspecified"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/shipping_rates/Sample Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/sigma/saved_queries/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/sigma/saved_queries/Sample Data')
            .send({
              "name": "API Test Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/sigma/saved_queries/Sample Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/sigma/scheduled_query_runs', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/sigma/scheduled_query_runs')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/sigma/scheduled_query_runs/{scheduled_query_run}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/sigma/scheduled_query_runs/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/sources', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/sources')
            .send({
              "amount": 1,
              "currency": "API Test Data",
              "expand": [
                "API Test Data"
              ],
              "mandate": {
                "acceptance": {
                  "date": 869,
                  "ip": "API Test Data",
                  "offline": {
                    "contact_email": "API Test Data"
                  },
                  "online": {
                    "user_agent": "API Test Data"
                  },
                  "status": "pending",
                  "type": "online",
                  "user_agent": "API Test Data"
                },
                "currency": "Sample Data"
              },
              "metadata": {},
              "original_source": "API Test Data",
              "owner": {
                "address": {
                  "city": "Test String",
                  "country": "Sample Data",
                  "line1": "API Test Data",
                  "state": "Test String"
                },
                "email": "Generated Value",
                "name": "Generated Value",
                "phone": "Sample Data"
              },
              "receiver": {},
              "redirect": {
                "return_url": "Sample Data"
              },
              "type": "Generated Value"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/sources')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/sources/{source}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/sources/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/sources/{source}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/sources/Test String')
            .send({
              "amount": 347,
              "expand": [
                "Sample Data",
                "Sample Data",
                "Generated Value"
              ],
              "metadata": {
                "id": 444,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.920Z"
              },
              "source_order": {
                "items": [
                  {
                    "amount": 902,
                    "currency": "Generated Value",
                    "description": "Test String",
                    "parent": "Sample Data",
                    "quantity": 780
                  },
                  {
                    "amount": 748,
                    "currency": "Sample Data",
                    "description": "Generated Value",
                    "parent": "Sample Data",
                    "quantity": 204
                  },
                  {
                    "amount": 927,
                    "currency": "Generated Value",
                    "quantity": 427,
                    "type": "shipping"
                  }
                ],
                "shipping": {
                  "address": {
                    "city": "API Test Data",
                    "line1": "Test String",
                    "line2": "Generated Value",
                    "postal_code": "API Test Data"
                  },
                  "carrier": "API Test Data",
                  "name": "Sample Data",
                  "phone": "API Test Data",
                  "tracking_number": "Generated Value"
                }
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/sources/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/sources/{source}/mandate_notifications/{mandate_notification}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/sources/Sample Data/mandate_notifications/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/sources/{source}/source_transactions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/sources/Generated Value/source_transactions')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/sources/{source}/source_transactions/{source_transaction}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/sources/Sample Data/source_transactions/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/sources/{source}/verify', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/sources/Sample Data/verify')
            .send({
              "expand": [
                "Generated Value",
                "Test String"
              ],
              "values": [
                "Generated Value",
                "Sample Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/sources/Sample Data/verify')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/subscription_items', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/subscription_items')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/subscription_items', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/subscription_items')
            .send({
              "billing_thresholds": {
                "id": 440,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.920Z"
              },
              "discounts": {
                "id": 193,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.920Z"
              },
              "expand": [
                "API Test Data",
                "Test String"
              ],
              "metadata": {},
              "price": "API Test Data",
              "price_data": {
                "currency": "Generated Value",
                "product": "Sample Data",
                "recurring": {
                  "interval": "year",
                  "interval_count": 155
                },
                "tax_behavior": "exclusive",
                "unit_amount": 310,
                "unit_amount_decimal": "API Test Data"
              },
              "proration_date": 134,
              "quantity": 170,
              "subscription": "Generated Value",
              "tax_rates": {
                "id": 321,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.920Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/subscription_items')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/subscription_items/{item}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/subscription_items/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/subscription_items/{item}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/subscription_items/Generated Value')
            .send({
              "discounts": {
                "id": 213,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.920Z"
              },
              "expand": [
                "Test String"
              ],
              "metadata": {
                "id": 331,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.920Z"
              },
              "off_session": true,
              "price_data": {
                "currency": "Test String",
                "product": "Test String",
                "recurring": {
                  "interval": "day",
                  "interval_count": 993
                },
                "tax_behavior": "unspecified",
                "unit_amount": 806,
                "unit_amount_decimal": "Test String"
              },
              "proration_behavior": "create_prorations",
              "proration_date": 834,
              "quantity": 760,
              "tax_rates": {
                "id": 207,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.920Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/subscription_items/Generated Value')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/subscription_items/{item}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/subscription_items/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/subscription_schedules', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/subscription_schedules')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/subscription_schedules', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/subscription_schedules')
            .send({
              "billing_mode": {
                "type": "flexible"
              },
              "customer": "Generated Value",
              "default_settings": {
                "application_fee_percent": 543.56,
                "automatic_tax": {
                  "enabled": true,
                  "liability": {
                    "account": "Sample Data",
                    "type": "self"
                  }
                },
                "billing_cycle_anchor": "automatic",
                "billing_thresholds": {
                  "id": 220,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.920Z"
                },
                "default_payment_method": "API Test Data",
                "invoice_settings": {
                  "account_tax_ids": {
                    "id": 983,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.920Z"
                  }
                },
                "on_behalf_of": {
                  "id": 625,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.920Z"
                },
                "transfer_data": {
                  "id": 636,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.920Z"
                }
              },
              "end_behavior": "none",
              "metadata": {
                "id": 133,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.920Z"
              },
              "phases": [
                {
                  "add_invoice_items": [
                    {
                      "discounts": [
                        {
                          "coupon": "API Test Data",
                          "promotion_code": "Test String"
                        },
                        {
                          "discount": "Generated Value",
                          "promotion_code": "Generated Value"
                        },
                        {
                          "promotion_code": "Generated Value"
                        }
                      ],
                      "price": "Test String",
                      "price_data": {
                        "currency": "Sample Data",
                        "product": "Test String",
                        "tax_behavior": "unspecified",
                        "unit_amount_decimal": "Test String"
                      },
                      "quantity": 116
                    },
                    {
                      "discounts": [
                        {
                          "discount": "API Test Data"
                        },
                        {
                          "coupon": "Sample Data",
                          "discount": "Sample Data",
                          "promotion_code": "Test String"
                        }
                      ],
                      "price_data": {
                        "currency": "Test String",
                        "product": "Generated Value",
                        "tax_behavior": "unspecified",
                        "unit_amount": 313,
                        "unit_amount_decimal": "Test String"
                      },
                      "tax_rates": {
                        "id": 431,
                        "name": "Generated Test Data",
                        "status": "active",
                        "createdAt": "2025-08-14T09:47:07.920Z"
                      }
                    },
                    {
                      "price": "Generated Value",
                      "price_data": {
                        "currency": "Test String",
                        "product": "Generated Value",
                        "unit_amount": 886,
                        "unit_amount_decimal": "Generated Value"
                      },
                      "quantity": 105,
                      "tax_rates": {
                        "id": 896,
                        "name": "Generated Test Data",
                        "status": "active",
                        "createdAt": "2025-08-14T09:47:07.920Z"
                      }
                    }
                  ],
                  "application_fee_percent": 204.89,
                  "automatic_tax": {
                    "enabled": false,
                    "liability": {
                      "account": "Test String",
                      "type": "self"
                    }
                  },
                  "billing_thresholds": {
                    "id": 252,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.920Z"
                  },
                  "collection_method": "send_invoice",
                  "currency": "Sample Data",
                  "discounts": {
                    "id": 793,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.920Z"
                  },
                  "duration": {
                    "interval": "week",
                    "interval_count": 180
                  },
                  "end_date": 747,
                  "items": [
                    {
                      "billing_thresholds": {
                        "id": 691,
                        "name": "Generated Test Data",
                        "status": "active",
                        "createdAt": "2025-08-14T09:47:07.920Z"
                      },
                      "discounts": {
                        "id": 509,
                        "name": "Generated Test Data",
                        "status": "active",
                        "createdAt": "2025-08-14T09:47:07.920Z"
                      },
                      "quantity": 207,
                      "tax_rates": {
                        "id": 228,
                        "name": "Generated Test Data",
                        "status": "active",
                        "createdAt": "2025-08-14T09:47:07.920Z"
                      }
                    },
                    {
                      "billing_thresholds": {
                        "id": 243,
                        "name": "Generated Test Data",
                        "status": "active",
                        "createdAt": "2025-08-14T09:47:07.920Z"
                      },
                      "metadata": {},
                      "price": "Test String",
                      "price_data": {
                        "currency": "Test String",
                        "product": "Sample Data",
                        "recurring": {
                          "interval": "week",
                          "interval_count": 412
                        },
                        "unit_amount": 227
                      },
                      "quantity": 27,
                      "tax_rates": {
                        "id": 851,
                        "name": "Generated Test Data",
                        "status": "active",
                        "createdAt": "2025-08-14T09:47:07.920Z"
                      }
                    }
                  ],
                  "proration_behavior": "always_invoice",
                  "transfer_data": {
                    "destination": "Test String"
                  },
                  "trial": false
                }
              ],
              "start_date": {
                "id": 983,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.920Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/subscription_schedules')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/subscription_schedules/{schedule}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/subscription_schedules/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/subscription_schedules/{schedule}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/subscription_schedules/Test String')
            .send({
              "default_settings": {
                "application_fee_percent": 153.9,
                "billing_cycle_anchor": "automatic",
                "billing_thresholds": {
                  "id": 708,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.920Z"
                },
                "collection_method": "charge_automatically",
                "default_payment_method": "Sample Data",
                "description": {
                  "id": 48,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.920Z"
                },
                "invoice_settings": {
                  "days_until_due": 962
                },
                "on_behalf_of": {
                  "id": 518,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.920Z"
                },
                "transfer_data": {
                  "id": 289,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.920Z"
                }
              },
              "expand": [
                "Generated Value",
                "Generated Value",
                "API Test Data"
              ],
              "metadata": {
                "id": 713,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.920Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/subscription_schedules/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/subscription_schedules/{schedule}/cancel', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/subscription_schedules/Test String/cancel')
            .send({
              "expand": [
                "Test String",
                "Generated Value",
                "Generated Value"
              ],
              "invoice_now": true,
              "prorate": false
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/subscription_schedules/Test String/cancel')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/subscription_schedules/{schedule}/release', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/subscription_schedules/Generated Value/release')
            .send({
              "expand": [
                "Generated Value"
              ],
              "preserve_cancel_date": true
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/subscription_schedules/Generated Value/release')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/subscriptions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/subscriptions')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/subscriptions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/subscriptions')
            .send({
              "automatic_tax": {
                "enabled": false,
                "liability": {
                  "account": "Test String",
                  "type": "account"
                }
              },
              "backdate_start_date": 425,
              "billing_cycle_anchor_config": {
                "day_of_month": 183,
                "hour": 348,
                "minute": 27,
                "month": 511,
                "second": 343
              },
              "billing_thresholds": {
                "id": 65,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "cancel_at": {
                "id": 32,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "cancel_at_period_end": true,
              "collection_method": "send_invoice",
              "customer": "Test String",
              "default_payment_method": "Test String",
              "default_source": "API Test Data",
              "default_tax_rates": {
                "id": 526,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "items": [
                {
                  "discounts": {
                    "id": 346,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.921Z"
                  },
                  "price": "Generated Value",
                  "price_data": {
                    "currency": "API Test Data",
                    "product": "Generated Value",
                    "recurring": {
                      "interval": "month",
                      "interval_count": 149
                    },
                    "tax_behavior": "unspecified",
                    "unit_amount_decimal": "Sample Data"
                  },
                  "tax_rates": {
                    "id": 693,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.921Z"
                  }
                }
              ],
              "metadata": {
                "id": 506,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "payment_behavior": "error_if_incomplete",
              "payment_settings": {
                "payment_method_options": {
                  "acss_debit": {
                    "id": 615,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.921Z"
                  },
                  "bancontact": {
                    "id": 188,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.921Z"
                  },
                  "card": {
                    "id": 233,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.921Z"
                  },
                  "customer_balance": {
                    "id": 228,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.921Z"
                  },
                  "konbini": {
                    "id": 974,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.921Z"
                  },
                  "sepa_debit": {
                    "id": 941,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.921Z"
                  },
                  "us_bank_account": {
                    "id": 368,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.921Z"
                  }
                },
                "payment_method_types": {
                  "id": 902,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.921Z"
                }
              },
              "pending_invoice_item_interval": {
                "id": 347,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "transfer_data": {
                "amount_percent": 172.59,
                "destination": "API Test Data"
              },
              "trial_end": {
                "id": 630,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "trial_period_days": 587
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/subscriptions')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/subscriptions/search', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/subscriptions/search')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/subscriptions/{subscription_exposed_id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/subscriptions/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/subscriptions/{subscription_exposed_id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/subscriptions/API Test Data')
            .send({
              "add_invoice_items": [
                {
                  "price": "Generated Value",
                  "tax_rates": {
                    "id": 475,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.921Z"
                  }
                },
                {
                  "discounts": [
                    {
                      "coupon": "Test String",
                      "discount": "Test String",
                      "promotion_code": "Test String"
                    },
                    {
                      "coupon": "API Test Data",
                      "promotion_code": "API Test Data"
                    },
                    {
                      "coupon": "Test String",
                      "discount": "Test String",
                      "promotion_code": "Sample Data"
                    }
                  ],
                  "price_data": {
                    "currency": "Sample Data",
                    "product": "API Test Data",
                    "tax_behavior": "unspecified",
                    "unit_amount_decimal": "Sample Data"
                  },
                  "quantity": 976,
                  "tax_rates": {
                    "id": 910,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.921Z"
                  }
                },
                {
                  "discounts": [
                    {
                      "coupon": "Generated Value",
                      "promotion_code": "Generated Value"
                    }
                  ],
                  "price_data": {
                    "currency": "API Test Data",
                    "product": "Sample Data",
                    "tax_behavior": "inclusive",
                    "unit_amount": 880,
                    "unit_amount_decimal": "Test String"
                  },
                  "quantity": 949
                }
              ],
              "automatic_tax": {
                "enabled": true,
                "liability": {
                  "type": "account"
                }
              },
              "billing_cycle_anchor": "now",
              "cancel_at": {
                "id": 281,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "cancel_at_period_end": false,
              "cancellation_details": {
                "comment": {
                  "id": 809,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.921Z"
                },
                "feedback": "too_expensive"
              },
              "collection_method": "charge_automatically",
              "days_until_due": 165,
              "default_payment_method": "Test String",
              "default_source": {
                "id": 836,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "default_tax_rates": {
                "id": 610,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "description": {
                "id": 208,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "discounts": {
                "id": 864,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "expand": [
                "Generated Value",
                "API Test Data",
                "Test String"
              ],
              "invoice_settings": {
                "account_tax_ids": {
                  "id": 865,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.921Z"
                }
              },
              "items": [
                {
                  "billing_thresholds": {
                    "id": 562,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.921Z"
                  },
                  "clear_usage": true,
                  "deleted": false,
                  "discounts": {
                    "id": 332,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.921Z"
                  },
                  "metadata": {
                    "id": 830,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.921Z"
                  },
                  "price_data": {
                    "currency": "Sample Data",
                    "product": "Test String",
                    "recurring": {
                      "interval": "week",
                      "interval_count": 688
                    },
                    "tax_behavior": "exclusive",
                    "unit_amount": 883,
                    "unit_amount_decimal": "API Test Data"
                  },
                  "quantity": 367,
                  "tax_rates": {
                    "id": 93,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.921Z"
                  }
                },
                {
                  "billing_thresholds": {
                    "id": 689,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.921Z"
                  },
                  "deleted": true,
                  "discounts": {
                    "id": 263,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.921Z"
                  },
                  "id": "Generated Value",
                  "price": "Sample Data",
                  "quantity": 672
                }
              ],
              "metadata": {
                "id": 296,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "on_behalf_of": {
                "id": 561,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "pause_collection": {
                "id": 531,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "payment_behavior": "error_if_incomplete",
              "pending_invoice_item_interval": {
                "id": 943,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "proration_behavior": "create_prorations",
              "transfer_data": {
                "id": 298,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "trial_end": {
                "id": 512,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "trial_from_plan": false,
              "trial_settings": {
                "end_behavior": {
                  "missing_payment_method": "cancel"
                }
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/subscriptions/API Test Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/subscriptions/{subscription_exposed_id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/subscriptions/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('DELETE /v1/subscriptions/{subscription_exposed_id}/discount', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/subscriptions/API Test Data/discount')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/subscriptions/{subscription}/migrate', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/subscriptions/Generated Value/migrate')
            .send({
              "billing_mode": {
                "type": "flexible"
              },
              "expand": [
                "Generated Value",
                "API Test Data",
                "Generated Value"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/subscriptions/Generated Value/migrate')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/subscriptions/{subscription}/resume', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/subscriptions/Test String/resume')
            .send({
              "billing_cycle_anchor": "unchanged",
              "expand": [
                "Sample Data",
                "Generated Value"
              ],
              "proration_behavior": "always_invoice",
              "proration_date": 408
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/subscriptions/Test String/resume')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/tax/calculations', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/tax/calculations')
            .send({
              "currency": "Generated Value",
              "customer": "Generated Value",
              "expand": [
                "Generated Value"
              ],
              "line_items": [
                {
                  "amount": 150,
                  "product": "Test String",
                  "quantity": 197,
                  "reference": "API Test Data",
                  "tax_behavior": "exclusive"
                }
              ],
              "ship_from_details": {
                "address": {
                  "city": {
                    "id": 570,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.921Z"
                  },
                  "country": "Sample Data",
                  "line1": {
                    "id": 49,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.921Z"
                  },
                  "state": {
                    "id": 776,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.921Z"
                  }
                }
              },
              "tax_date": 198
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/tax/calculations')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/tax/calculations/{calculation}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/tax/calculations/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/tax/calculations/{calculation}/line_items', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/tax/calculations/Generated Value/line_items')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/tax/registrations', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/tax/registrations')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/tax/registrations', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/tax/registrations')
            .send({
              "active_from": {
                "id": 555,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "country": "API Test Data",
              "country_options": {
                "ae": {
                  "standard": {
                    "place_of_supply_scheme": "standard"
                  },
                  "type": "standard"
                },
                "am": {
                  "type": "simplified"
                },
                "at": {
                  "standard": {
                    "place_of_supply_scheme": "standard"
                  },
                  "type": "standard"
                },
                "au": {
                  "standard": {},
                  "type": "standard"
                },
                "aw": {
                  "type": "standard"
                },
                "az": {
                  "type": "simplified"
                },
                "ba": {
                  "type": "standard"
                },
                "bd": {
                  "standard": {},
                  "type": "standard"
                },
                "bf": {
                  "type": "standard"
                },
                "bg": {
                  "type": "ioss"
                },
                "bh": {
                  "type": "standard"
                },
                "bj": {
                  "type": "simplified"
                },
                "by": {
                  "type": "simplified"
                },
                "cd": {
                  "standard": {
                    "place_of_supply_scheme": "standard"
                  },
                  "type": "standard"
                },
                "cl": {
                  "type": "simplified"
                },
                "cm": {
                  "type": "simplified"
                },
                "co": {
                  "type": "simplified"
                },
                "cr": {
                  "type": "simplified"
                },
                "cz": {
                  "standard": {
                    "place_of_supply_scheme": "small_seller"
                  },
                  "type": "oss_non_union"
                },
                "dk": {
                  "standard": {
                    "place_of_supply_scheme": "small_seller"
                  },
                  "type": "oss_non_union"
                },
                "ec": {
                  "type": "simplified"
                },
                "ee": {
                  "standard": {
                    "place_of_supply_scheme": "standard"
                  },
                  "type": "oss_union"
                },
                "eg": {
                  "type": "simplified"
                },
                "es": {
                  "standard": {
                    "place_of_supply_scheme": "standard"
                  },
                  "type": "oss_union"
                },
                "et": {
                  "standard": {
                    "place_of_supply_scheme": "inbound_goods"
                  },
                  "type": "standard"
                },
                "gb": {
                  "type": "standard"
                },
                "gr": {
                  "standard": {
                    "place_of_supply_scheme": "inbound_goods"
                  },
                  "type": "ioss"
                },
                "hr": {
                  "standard": {
                    "place_of_supply_scheme": "small_seller"
                  },
                  "type": "standard"
                },
                "hu": {
                  "standard": {
                    "place_of_supply_scheme": "standard"
                  },
                  "type": "oss_union"
                },
                "ie": {
                  "standard": {
                    "place_of_supply_scheme": "small_seller"
                  },
                  "type": "ioss"
                },
                "in": {
                  "type": "simplified"
                },
                "is": {
                  "type": "standard"
                },
                "jp": {
                  "standard": {
                    "place_of_supply_scheme": "inbound_goods"
                  },
                  "type": "standard"
                },
                "ke": {
                  "type": "simplified"
                },
                "kg": {
                  "type": "simplified"
                },
                "kh": {
                  "type": "simplified"
                },
                "kr": {
                  "type": "simplified"
                },
                "kz": {
                  "type": "simplified"
                },
                "md": {
                  "type": "simplified"
                },
                "mk": {
                  "type": "standard"
                },
                "mr": {
                  "type": "standard"
                },
                "mt": {
                  "standard": {
                    "place_of_supply_scheme": "standard"
                  },
                  "type": "ioss"
                },
                "mx": {
                  "type": "simplified"
                },
                "ng": {
                  "type": "simplified"
                },
                "no": {
                  "standard": {
                    "place_of_supply_scheme": "inbound_goods"
                  },
                  "type": "standard"
                },
                "nz": {
                  "standard": {
                    "place_of_supply_scheme": "standard"
                  },
                  "type": "standard"
                },
                "om": {
                  "type": "standard"
                },
                "pe": {
                  "type": "simplified"
                },
                "ph": {
                  "type": "simplified"
                },
                "pl": {
                  "standard": {
                    "place_of_supply_scheme": "standard"
                  },
                  "type": "oss_union"
                },
                "rs": {
                  "standard": {
                    "place_of_supply_scheme": "standard"
                  },
                  "type": "standard"
                },
                "ru": {
                  "type": "simplified"
                },
                "se": {
                  "type": "standard"
                },
                "sg": {
                  "standard": {
                    "place_of_supply_scheme": "inbound_goods"
                  },
                  "type": "standard"
                },
                "si": {
                  "type": "ioss"
                },
                "sk": {
                  "standard": {
                    "place_of_supply_scheme": "inbound_goods"
                  },
                  "type": "standard"
                },
                "sn": {
                  "type": "simplified"
                },
                "th": {
                  "type": "simplified"
                },
                "tr": {
                  "type": "simplified"
                },
                "tz": {
                  "type": "simplified"
                },
                "ua": {
                  "type": "simplified"
                },
                "ug": {
                  "type": "simplified"
                },
                "vn": {
                  "type": "simplified"
                }
              },
              "expand": [
                "API Test Data",
                "API Test Data"
              ],
              "expires_at": 397
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/tax/registrations')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/tax/registrations/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/tax/registrations/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/tax/registrations/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/tax/registrations/API Test Data')
            .send({
              "active_from": {
                "id": 751,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "expand": [
                "Sample Data",
                "API Test Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/tax/registrations/API Test Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/tax/settings', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/tax/settings')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/tax/settings', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/tax/settings')
            .send({
              "defaults": {
                "tax_behavior": "exclusive",
                "tax_code": "Sample Data"
              },
              "head_office": {
                "address": {
                  "city": "Generated Value",
                  "country": "Test String",
                  "line1": "Sample Data",
                  "line2": "API Test Data",
                  "postal_code": "Test String",
                  "state": "Generated Value"
                }
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/tax/settings')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/tax/transactions/create_from_calculation', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/tax/transactions/create_from_calculation')
            .send({
              "calculation": "API Test Data",
              "expand": [
                "Sample Data",
                "Sample Data",
                "Generated Value"
              ],
              "posted_at": 481,
              "reference": "Sample Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/tax/transactions/create_from_calculation')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/tax/transactions/create_reversal', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/tax/transactions/create_reversal')
            .send({
              "expand": [
                "Generated Value"
              ],
              "flat_amount": 353,
              "line_items": [
                {
                  "amount": 103,
                  "amount_tax": 306,
                  "metadata": {},
                  "original_line_item": "Generated Value",
                  "reference": "API Test Data"
                },
                {
                  "amount": 10,
                  "amount_tax": 518,
                  "metadata": {},
                  "original_line_item": "API Test Data",
                  "quantity": 847,
                  "reference": "Generated Value"
                },
                {
                  "amount": 986,
                  "amount_tax": 8,
                  "original_line_item": "API Test Data",
                  "quantity": 62,
                  "reference": "API Test Data"
                }
              ],
              "metadata": {},
              "mode": "partial",
              "original_transaction": "Generated Value",
              "reference": "Generated Value",
              "shipping_cost": {
                "amount": 15,
                "amount_tax": 125
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/tax/transactions/create_reversal')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/tax/transactions/{transaction}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/tax/transactions/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/tax/transactions/{transaction}/line_items', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/tax/transactions/API Test Data/line_items')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/tax_codes', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/tax_codes')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/tax_codes/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/tax_codes/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/tax_ids', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/tax_ids')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/tax_ids', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/tax_ids')
            .send({
              "type": "eg_tin",
              "value": "API Test Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/tax_ids')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/tax_ids/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/tax_ids/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('DELETE /v1/tax_ids/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/tax_ids/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/tax_rates', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/tax_rates')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/tax_rates', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/tax_rates')
            .send({
              "active": true,
              "country": "API Test Data",
              "description": "Test String",
              "display_name": "Sample Data",
              "expand": [
                "Generated Value",
                "API Test Data"
              ],
              "inclusive": false,
              "jurisdiction": "API Test Data",
              "percentage": 811.1,
              "tax_type": "jct"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/tax_rates')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/tax_rates/{tax_rate}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/tax_rates/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/tax_rates/{tax_rate}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/tax_rates/Test String')
            .send({
              "active": true,
              "country": "Generated Value",
              "description": "Test String",
              "display_name": "API Test Data",
              "expand": [
                "Sample Data",
                "Generated Value",
                "Generated Value"
              ],
              "jurisdiction": "API Test Data",
              "metadata": {
                "id": 117,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "state": "Sample Data",
              "tax_type": "gst"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/tax_rates/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/terminal/configurations', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/terminal/configurations')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/terminal/configurations', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/configurations')
            .send({
              "bbpos_wisepos_e": {
                "splashscreen": {
                  "id": 594,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.921Z"
                }
              },
              "name": "Generated Value",
              "offline": {
                "id": 847,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "reboot_window": {
                "end_hour": 139,
                "start_hour": 877
              },
              "tipping": {
                "id": 341,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "verifone_p400": {
                "splashscreen": {
                  "id": 351,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.921Z"
                }
              },
              "wifi": {
                "id": 399,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/configurations')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/terminal/configurations/{configuration}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/terminal/configurations/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/terminal/configurations/{configuration}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/configurations/Test String')
            .send({
              "expand": [
                "API Test Data",
                "Test String",
                "Sample Data"
              ],
              "name": "Generated Value",
              "reboot_window": {
                "id": 577,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "tipping": {
                "id": 490,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              },
              "verifone_p400": {
                "id": 895,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.921Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/configurations/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/terminal/configurations/{configuration}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/terminal/configurations/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/terminal/connection_tokens', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/connection_tokens')
            .send({})
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/connection_tokens')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/terminal/locations', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/terminal/locations')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/terminal/locations', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/locations')
            .send({
              "address": {
                "city": "Sample Data",
                "country": "API Test Data",
                "line2": "Test String",
                "postal_code": "Sample Data",
                "state": "Sample Data"
              },
              "configuration_overrides": "Sample Data",
              "display_name": "Test String"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/locations')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/terminal/locations/{location}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/terminal/locations/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/terminal/locations/{location}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/locations/API Test Data')
            .send({
              "address": {
                "city": "Sample Data",
                "country": "API Test Data",
                "line2": "Generated Value",
                "postal_code": "Generated Value"
              },
              "configuration_overrides": {
                "id": 379,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.922Z"
              },
              "display_name": {
                "id": 265,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.922Z"
              },
              "metadata": {
                "id": 946,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.922Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/locations/API Test Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/terminal/locations/{location}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/terminal/locations/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/terminal/readers', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/terminal/readers')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/terminal/readers', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/readers')
            .send({
              "expand": [
                "API Test Data"
              ],
              "location": "Generated Value",
              "metadata": {
                "id": 117,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.922Z"
              },
              "registration_code": "Sample Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/readers')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/terminal/readers/{reader}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/terminal/readers/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/terminal/readers/{reader}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/readers/Generated Value')
            .send({
              "expand": [
                "Sample Data",
                "Test String"
              ],
              "label": {
                "id": 648,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.922Z"
              },
              "metadata": {
                "id": 802,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.922Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/readers/Generated Value')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/terminal/readers/{reader}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/terminal/readers/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/terminal/readers/{reader}/cancel_action', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/readers/API Test Data/cancel_action')
            .send({
              "expand": [
                "Generated Value",
                "Sample Data",
                "Generated Value"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/readers/API Test Data/cancel_action')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/terminal/readers/{reader}/collect_inputs', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/readers/API Test Data/collect_inputs')
            .send({
              "inputs": [
                {
                  "custom_text": {
                    "description": "Generated Value",
                    "skip_button": "Generated Valu",
                    "title": "Test String"
                  },
                  "required": true,
                  "selection": {
                    "choices": [
                      {
                        "id": "Generated Value",
                        "text": "API Test Data"
                      },
                      {
                        "id": "Test String",
                        "style": "primary",
                        "text": "Test String"
                      }
                    ]
                  },
                  "toggles": [
                    {
                      "default_value": "disabled",
                      "description": "Generated Value",
                      "title": "Generated Value"
                    },
                    {
                      "description": "API Test Data",
                      "title": "Sample Data"
                    },
                    {
                      "default_value": "enabled",
                      "title": "API Test Data"
                    }
                  ],
                  "type": "selection"
                }
              ],
              "metadata": {}
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/readers/API Test Data/collect_inputs')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/terminal/readers/{reader}/collect_payment_method', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/readers/Test String/collect_payment_method')
            .send({
              "collect_config": {
                "allow_redisplay": "limited",
                "enable_customer_cancellation": true,
                "skip_tipping": true,
                "tipping": {
                  "amount_eligible": 888
                }
              },
              "expand": [
                "API Test Data"
              ],
              "payment_intent": "Generated Value"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/readers/Test String/collect_payment_method')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/terminal/readers/{reader}/confirm_payment_intent', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/readers/Test String/confirm_payment_intent')
            .send({
              "expand": [
                "Generated Value"
              ],
              "payment_intent": "Test String"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/readers/Test String/confirm_payment_intent')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/terminal/readers/{reader}/process_payment_intent', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/readers/Generated Value/process_payment_intent')
            .send({
              "expand": [
                "Test String",
                "Generated Value"
              ],
              "payment_intent": "API Test Data",
              "process_config": {
                "return_url": "Generated Value",
                "skip_tipping": false,
                "tipping": {
                  "amount_eligible": 131
                }
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/readers/Generated Value/process_payment_intent')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/terminal/readers/{reader}/process_setup_intent', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/readers/Test String/process_setup_intent')
            .send({
              "allow_redisplay": "always",
              "expand": [
                "Generated Value",
                "Sample Data",
                "API Test Data"
              ],
              "setup_intent": "Generated Value"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/readers/Test String/process_setup_intent')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/terminal/readers/{reader}/refund_payment', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/readers/Sample Data/refund_payment')
            .send({
              "amount": 483,
              "charge": "API Test Data",
              "metadata": {},
              "payment_intent": "API Test Data",
              "refund_application_fee": true,
              "refund_payment_config": {
                "enable_customer_cancellation": true
              },
              "reverse_transfer": true
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/readers/Sample Data/refund_payment')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/terminal/readers/{reader}/set_reader_display', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/readers/Sample Data/set_reader_display')
            .send({
              "type": "cart"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/terminal/readers/Sample Data/set_reader_display')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/confirmation_tokens', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/confirmation_tokens')
            .send({
              "expand": [
                "Generated Value"
              ],
              "payment_method": "Sample Data",
              "payment_method_data": {
                "acss_debit": {
                  "account_number": "API Test Data",
                  "institution_number": "Sample Data",
                  "transit_number": "Test String"
                },
                "affirm": {},
                "afterpay_clearpay": {},
                "alipay": {},
                "au_becs_debit": {
                  "account_number": "Test String",
                  "bsb_number": "Generated Value"
                },
                "bacs_debit": {
                  "account_number": "API Test Data",
                  "sort_code": "Sample Data"
                },
                "bancontact": {},
                "billie": {},
                "billing_details": {
                  "address": {
                    "id": 70,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.922Z"
                  },
                  "email": {
                    "id": 495,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.922Z"
                  },
                  "name": {
                    "id": 439,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.922Z"
                  },
                  "phone": {
                    "id": 99,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.922Z"
                  }
                },
                "blik": {},
                "boleto": {
                  "tax_id": "API Test Data"
                },
                "cashapp": {},
                "crypto": {},
                "customer_balance": {},
                "eps": {
                  "bank": "schoellerbank_ag"
                },
                "grabpay": {},
                "ideal": {
                  "bank": "sns_bank"
                },
                "kakao_pay": {},
                "klarna": {},
                "link": {},
                "metadata": {},
                "mobilepay": {},
                "multibanco": {},
                "nz_bank_account": {
                  "account_holder_name": "Sample Data",
                  "account_number": "Test String",
                  "bank_code": "API Test Data",
                  "branch_code": "Test String",
                  "suffix": "API Test Data"
                },
                "oxxo": {},
                "p24": {},
                "pay_by_bank": {},
                "payco": {},
                "paynow": {},
                "paypal": {},
                "promptpay": {},
                "radar_options": {},
                "revolut_pay": {},
                "sepa_debit": {
                  "iban": "Test String"
                },
                "swish": {},
                "twint": {},
                "type": "zip",
                "us_bank_account": {
                  "account_holder_type": "company",
                  "account_type": "checking",
                  "financial_connections_account": "Sample Data",
                  "routing_number": "API Test Data"
                },
                "wechat_pay": {},
                "zip": {}
              },
              "payment_method_options": {
                "card": {
                  "installments": {
                    "plan": {
                      "count": 738,
                      "type": "bonus"
                    }
                  }
                }
              },
              "return_url": "Test String",
              "setup_future_usage": "on_session",
              "shipping": {
                "address": {
                  "city": "Generated Value",
                  "country": "API Test Data",
                  "line1": "Sample Data",
                  "line2": "Sample Data",
                  "postal_code": "API Test Data",
                  "state": "Sample Data"
                },
                "name": "Test String",
                "phone": {
                  "id": 587,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.922Z"
                }
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/confirmation_tokens')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/customers/{customer}/fund_cash_balance', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/customers/API Test Data/fund_cash_balance')
            .send({
              "amount": 116,
              "currency": "API Test Data",
              "reference": "Generated Value"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/customers/API Test Data/fund_cash_balance')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/issuing/authorizations', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/authorizations')
            .send({
              "card": "Sample Data",
              "currency": "API Test Data",
              "is_amount_controllable": true,
              "merchant_amount": 399,
              "merchant_currency": "API Test Data",
              "merchant_data": {
                "city": "API Test Data",
                "name": "Test String",
                "postal_code": "Generated Value",
                "state": "Generated Value",
                "terminal_id": "Sample Data",
                "url": "API Test Data"
              },
              "verification_data": {
                "address_line1_check": "match",
                "authentication_exemption": {
                  "claimed_by": "issuer",
                  "type": "transaction_risk_analysis"
                },
                "cvc_check": "match",
                "expiry_check": "mismatch",
                "three_d_secure": {
                  "result": "authenticated"
                }
              },
              "wallet": "apple_pay"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/authorizations')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/issuing/authorizations/{authorization}/capture', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/authorizations/Sample Data/capture')
            .send({
              "capture_amount": 806,
              "expand": [
                "Test String"
              ],
              "purchase_details": {
                "fleet": {
                  "purchase_type": "fuel_and_non_fuel_purchase",
                  "reported_breakdown": {
                    "fuel": {},
                    "non_fuel": {
                      "gross_amount_decimal": "Sample Data"
                    },
                    "tax": {
                      "local_amount_decimal": "Sample Data"
                    }
                  },
                  "service_type": "non_fuel_transaction"
                },
                "flight": {
                  "departure_at": 408,
                  "passenger_name": "API Test Data",
                  "refundable": true,
                  "segments": [
                    {
                      "arrival_airport_code": "Sam",
                      "flight_number": "Test String",
                      "service_class": "Generated Value",
                      "stopover_allowed": false
                    },
                    {
                      "arrival_airport_code": "Tes",
                      "departure_airport_code": "Sam",
                      "flight_number": "Sample Data",
                      "service_class": "Generated Value"
                    }
                  ],
                  "travel_agency": "Test String"
                },
                "lodging": {
                  "check_in_at": 98,
                  "nights": 320
                },
                "reference": "API Test Data"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/authorizations/Sample Data/capture')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/issuing/authorizations/{authorization}/expire', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/authorizations/Test String/expire')
            .send({
              "expand": [
                "Sample Data",
                "Test String",
                "Test String"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/authorizations/Test String/expire')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/issuing/authorizations/{authorization}/finalize_amount', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/authorizations/Test String/finalize_amount')
            .send({
              "expand": [
                "Sample Data"
              ],
              "final_amount": 464,
              "fleet": {
                "cardholder_prompt_data": {
                  "driver_id": "Test String",
                  "user_id": "API Test Data",
                  "vehicle_number": "Sample Data"
                },
                "purchase_type": "non_fuel_purchase",
                "reported_breakdown": {
                  "fuel": {
                    "gross_amount_decimal": "Sample Data"
                  },
                  "tax": {
                    "local_amount_decimal": "Sample Data"
                  }
                },
                "service_type": "self_service"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/authorizations/Test String/finalize_amount')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/issuing/authorizations/{authorization}/fraud_challenges/respond', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/authorizations/API Test Data/fraud_challenges/respond')
            .send({
              "confirmed": false,
              "expand": [
                "Test String"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/authorizations/API Test Data/fraud_challenges/respond')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/issuing/authorizations/{authorization}/increment', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/authorizations/Sample Data/increment')
            .send({
              "expand": [
                "API Test Data"
              ],
              "increment_amount": 515,
              "is_amount_controllable": false
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/authorizations/Sample Data/increment')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/issuing/authorizations/{authorization}/reverse', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/authorizations/Sample Data/reverse')
            .send({
              "expand": [
                "Sample Data"
              ],
              "reverse_amount": 550
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/authorizations/Sample Data/reverse')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/issuing/cards/{card}/shipping/deliver', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/cards/Generated Value/shipping/deliver')
            .send({
              "expand": [
                "API Test Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/cards/Generated Value/shipping/deliver')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/issuing/cards/{card}/shipping/fail', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/cards/Test String/shipping/fail')
            .send({
              "expand": [
                "Test String"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/cards/Test String/shipping/fail')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/issuing/cards/{card}/shipping/return', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/cards/Generated Value/shipping/return')
            .send({})
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/cards/Generated Value/shipping/return')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/issuing/cards/{card}/shipping/ship', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/cards/Test String/shipping/ship')
            .send({})
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/cards/Test String/shipping/ship')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/issuing/cards/{card}/shipping/submit', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/cards/Generated Value/shipping/submit')
            .send({
              "expand": [
                "Sample Data",
                "Test String"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/cards/Generated Value/shipping/submit')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/issuing/personalization_designs/{personalization_design}/activate', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/personalization_designs/Test String/activate')
            .send({
              "expand": [
                "API Test Data",
                "Sample Data",
                "API Test Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/personalization_designs/Test String/activate')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/issuing/personalization_designs/{personalization_design}/deactivate', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/personalization_designs/Test String/deactivate')
            .send({
              "expand": [
                "API Test Data",
                "Generated Value"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/personalization_designs/Test String/deactivate')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/issuing/personalization_designs/{personalization_design}/reject', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/personalization_designs/Sample Data/reject')
            .send({
              "expand": [
                "API Test Data"
              ],
              "rejection_reasons": {
                "carrier_text": [
                  "other_entity",
                  "other",
                  "inappropriate"
                ]
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/personalization_designs/Sample Data/reject')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/issuing/settlements', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/settlements')
            .send({
              "bin": "API Test Data",
              "clearing_date": 733,
              "currency": "Test String",
              "expand": [
                "API Test Data"
              ],
              "interchange_fees_amount": 92,
              "net_total_amount": 71,
              "network": "maestro",
              "network_settlement_identifier": "Generated Value",
              "transaction_count": 205
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/settlements')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/issuing/settlements/{settlement}/complete', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/settlements/Sample Data/complete')
            .send({
              "expand": [
                "API Test Data",
                "Sample Data",
                "API Test Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/settlements/Sample Data/complete')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/issuing/transactions/create_force_capture', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/transactions/create_force_capture')
            .send({
              "amount": 559,
              "card": "Sample Data",
              "currency": "Test String",
              "expand": [
                "Sample Data",
                "API Test Data",
                "Sample Data"
              ],
              "merchant_data": {
                "category": "fast_food_restaurants",
                "country": "Generated Value",
                "name": "Sample Data",
                "network_id": "API Test Data",
                "state": "Generated Value",
                "terminal_id": "Test String",
                "url": "Sample Data"
              },
              "purchase_details": {
                "fleet": {
                  "cardholder_prompt_data": {
                    "odometer": 554,
                    "unspecified_id": "Generated Value",
                    "user_id": "Test String",
                    "vehicle_number": "Test String"
                  },
                  "purchase_type": "fuel_purchase",
                  "reported_breakdown": {
                    "fuel": {},
                    "non_fuel": {
                      "gross_amount_decimal": "API Test Data"
                    }
                  },
                  "service_type": "full_service"
                },
                "fuel": {
                  "industry_product_code": "API Test Data",
                  "quantity_decimal": "Sample Data",
                  "unit": "other",
                  "unit_cost_decimal": "Generated Value"
                },
                "receipt": [
                  {
                    "total": 327
                  }
                ]
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/transactions/create_force_capture')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/issuing/transactions/create_unlinked_refund', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/transactions/create_unlinked_refund')
            .send({
              "amount": 544,
              "card": "Generated Value",
              "currency": "Sample Data",
              "expand": [
                "API Test Data"
              ],
              "merchant_data": {
                "category": "direct_marketing_combination_catalog_and_retail_merchant",
                "city": "Test String",
                "postal_code": "Test String",
                "state": "Generated Value",
                "terminal_id": "Test String",
                "url": "Test String"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/transactions/create_unlinked_refund')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/issuing/transactions/{transaction}/refund', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/transactions/Generated Value/refund')
            .send({
              "expand": [
                "Generated Value"
              ],
              "refund_amount": 192
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/issuing/transactions/Generated Value/refund')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/refunds/{refund}/expire', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/refunds/Test String/expire')
            .send({
              "expand": [
                "Sample Data",
                "Test String"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/refunds/Test String/expire')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/terminal/readers/{reader}/present_payment_method', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/terminal/readers/Test String/present_payment_method')
            .send({
              "amount_tip": 203,
              "card_present": {
                "number": "Generated Value"
              },
              "expand": [
                "Sample Data"
              ],
              "interac_present": {
                "number": "Generated Value"
              },
              "type": "interac_present"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/terminal/readers/Test String/present_payment_method')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/terminal/readers/{reader}/succeed_input_collection', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/terminal/readers/Test String/succeed_input_collection')
            .send({
              "expand": [
                "Generated Value",
                "Generated Value",
                "Generated Value"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/terminal/readers/Test String/succeed_input_collection')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/terminal/readers/{reader}/timeout_input_collection', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/terminal/readers/Generated Value/timeout_input_collection')
            .send({
              "expand": [
                "Generated Value"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/terminal/readers/Generated Value/timeout_input_collection')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/test_helpers/test_clocks', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/test_helpers/test_clocks')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/test_helpers/test_clocks', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/test_clocks')
            .send({
              "frozen_time": 612,
              "name": "Sample Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/test_clocks')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/test_helpers/test_clocks/{test_clock}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/test_helpers/test_clocks/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('DELETE /v1/test_helpers/test_clocks/{test_clock}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/test_helpers/test_clocks/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/test_helpers/test_clocks/{test_clock}/advance', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/test_clocks/Sample Data/advance')
            .send({
              "expand": [
                "Generated Value",
                "Test String"
              ],
              "frozen_time": 707
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/test_clocks/Sample Data/advance')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/treasury/inbound_transfers/{id}/fail', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/inbound_transfers/Generated Value/fail')
            .send({
              "expand": [
                "Generated Value",
                "Test String",
                "Sample Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/inbound_transfers/Generated Value/fail')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/treasury/inbound_transfers/{id}/return', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/inbound_transfers/Generated Value/return')
            .send({
              "expand": [
                "API Test Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/inbound_transfers/Generated Value/return')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/treasury/inbound_transfers/{id}/succeed', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/inbound_transfers/Test String/succeed')
            .send({})
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/inbound_transfers/Test String/succeed')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/treasury/outbound_payments/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/outbound_payments/Sample Data')
            .send({
              "expand": [
                "Generated Value"
              ],
              "tracking_details": {
                "ach": {
                  "trace_id": "API Test Data"
                },
                "type": "ach",
                "us_domestic_wire": {
                  "chips": "API Test Data",
                  "imad": "Generated Value",
                  "omad": "API Test Data"
                }
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/outbound_payments/Sample Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/treasury/outbound_payments/{id}/fail', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/outbound_payments/Test String/fail')
            .send({})
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/outbound_payments/Test String/fail')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/treasury/outbound_payments/{id}/post', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/outbound_payments/API Test Data/post')
            .send({})
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/outbound_payments/API Test Data/post')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/treasury/outbound_payments/{id}/return', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/outbound_payments/API Test Data/return')
            .send({
              "expand": [
                "API Test Data",
                "API Test Data",
                "API Test Data"
              ],
              "returned_details": {}
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/outbound_payments/API Test Data/return')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/treasury/outbound_transfers/{outbound_transfer}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/outbound_transfers/Test String')
            .send({
              "expand": [
                "Test String"
              ],
              "tracking_details": {
                "type": "ach",
                "us_domestic_wire": {
                  "imad": "Sample Data"
                }
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/outbound_transfers/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/treasury/outbound_transfers/{outbound_transfer}/fail', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/outbound_transfers/Test String/fail')
            .send({
              "expand": [
                "Sample Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/outbound_transfers/Test String/fail')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/treasury/outbound_transfers/{outbound_transfer}/post', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/outbound_transfers/API Test Data/post')
            .send({
              "expand": [
                "Generated Value"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/outbound_transfers/API Test Data/post')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/treasury/outbound_transfers/{outbound_transfer}/return', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/outbound_transfers/Test String/return')
            .send({
              "expand": [
                "API Test Data",
                "Sample Data",
                "Sample Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/outbound_transfers/Test String/return')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/treasury/received_credits', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/received_credits')
            .send({
              "amount": 483,
              "currency": "Test String",
              "description": "Test String",
              "financial_account": "Test String",
              "initiating_payment_method_details": {
                "type": "us_bank_account",
                "us_bank_account": {
                  "account_holder_name": "Sample Data",
                  "account_number": "API Test Data"
                }
              },
              "network": "ach"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/received_credits')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/test_helpers/treasury/received_debits', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/received_debits')
            .send({
              "amount": 409,
              "currency": "Generated Value",
              "description": "API Test Data",
              "expand": [
                "Generated Value"
              ],
              "financial_account": "Test String",
              "initiating_payment_method_details": {
                "type": "us_bank_account",
                "us_bank_account": {
                  "account_holder_name": "API Test Data"
                }
              },
              "network": "ach"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/test_helpers/treasury/received_debits')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/tokens', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/tokens')
            .send({
              "account": {
                "business_type": "company",
                "company": {
                  "address": {
                    "city": "Sample Data",
                    "country": "Test String",
                    "line1": "Test String",
                    "state": "Sample Data"
                  },
                  "address_kana": {
                    "city": "API Test Data",
                    "country": "Generated Value",
                    "line1": "Test String",
                    "postal_code": "Sample Data",
                    "state": "Sample Data",
                    "town": "Test String"
                  },
                  "directorship_declaration": {
                    "date": 63,
                    "ip": "Sample Data",
                    "user_agent": "API Test Data"
                  },
                  "executives_provided": true,
                  "name": "API Test Data",
                  "name_kana": "Sample Data",
                  "name_kanji": "Sample Data",
                  "ownership_declaration": {
                    "date": 250,
                    "user_agent": "Sample Data"
                  },
                  "ownership_declaration_shown_and_signed": false,
                  "registration_date": {
                    "id": 253,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.926Z"
                  },
                  "registration_number": "API Test Data",
                  "structure": "public_partnership",
                  "tax_id": "Generated Value",
                  "tax_id_registrar": "API Test Data",
                  "vat_id": "Test String"
                },
                "individual": {
                  "address": {
                    "city": "API Test Data",
                    "country": "Generated Value",
                    "line1": "Generated Value",
                    "line2": "Generated Value",
                    "state": "Test String"
                  },
                  "address_kana": {
                    "line1": "API Test Data",
                    "line2": "API Test Data",
                    "postal_code": "API Test Data",
                    "state": "Generated Value",
                    "town": "Generated Value"
                  },
                  "dob": {
                    "id": 277,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.926Z"
                  },
                  "email": "Sample Data",
                  "full_name_aliases": {
                    "id": 858,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.926Z"
                  },
                  "id_number": "API Test Data",
                  "id_number_secondary": "Test String",
                  "last_name_kana": "Test String",
                  "last_name_kanji": "Sample Data",
                  "metadata": {
                    "id": 698,
                    "name": "Generated Test Data",
                    "status": "active",
                    "createdAt": "2025-08-14T09:47:07.926Z"
                  },
                  "phone": "Sample Data",
                  "political_exposure": "existing",
                  "relationship": {
                    "director": true,
                    "executive": false,
                    "percent_ownership": {
                      "id": 206,
                      "name": "Generated Test Data",
                      "status": "active",
                      "createdAt": "2025-08-14T09:47:07.926Z"
                    }
                  },
                  "ssn_last_4": "API Test Data",
                  "verification": {
                    "document": {
                      "back": "Sample Data",
                      "front": "API Test Data"
                    }
                  }
                }
              },
              "card": {
                "id": 126,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.926Z"
              },
              "person": {
                "additional_tos_acceptances": {},
                "address": {
                  "country": "API Test Data",
                  "line2": "Sample Data",
                  "postal_code": "API Test Data",
                  "state": "Generated Value"
                },
                "dob": {
                  "id": 803,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.926Z"
                },
                "documents": {
                  "company_authorization": {},
                  "passport": {},
                  "visa": {}
                },
                "email": "Sample Data",
                "first_name": "Sample Data",
                "first_name_kanji": "API Test Data",
                "full_name_aliases": {
                  "id": 544,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.926Z"
                },
                "gender": "Sample Data",
                "id_number_secondary": "API Test Data",
                "last_name": "API Test Data",
                "last_name_kana": "Sample Data",
                "last_name_kanji": "Sample Data",
                "maiden_name": "API Test Data",
                "metadata": {
                  "id": 408,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.926Z"
                },
                "nationality": "API Test Data",
                "political_exposure": "existing",
                "registered_address": {
                  "city": "Generated Value",
                  "line1": "Sample Data",
                  "line2": "API Test Data",
                  "state": "API Test Data"
                },
                "us_cfpb_data": {
                  "ethnicity_details": {},
                  "race_details": {
                    "race_other": "Sample Data"
                  },
                  "self_identified_gender": "Sample Data"
                },
                "verification": {
                  "additional_document": {}
                }
              },
              "pii": {}
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/tokens')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/tokens/{token}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/tokens/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/topups', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/topups')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/topups', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/topups')
            .send({
              "amount": 314,
              "currency": "Test String",
              "description": "API Test Data",
              "expand": [
                "Sample Data",
                "Generated Value"
              ],
              "metadata": {
                "id": 821,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.927Z"
              },
              "transfer_group": "API Test Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/topups')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/topups/{topup}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/topups/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/topups/{topup}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/topups/Sample Data')
            .send({
              "description": "Sample Data",
              "expand": [
                "Generated Value"
              ],
              "metadata": {
                "id": 116,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.927Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/topups/Sample Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/topups/{topup}/cancel', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/topups/Test String/cancel')
            .send({})
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/topups/Test String/cancel')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/transfers', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/transfers')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/transfers', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/transfers')
            .send({
              "currency": "Test String",
              "description": "API Test Data",
              "destination": "API Test Data",
              "expand": [
                "Generated Value",
                "Generated Value",
                "API Test Data"
              ],
              "metadata": {},
              "source_transaction": "Test String",
              "source_type": "fpx",
              "transfer_group": "API Test Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/transfers')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/transfers/{id}/reversals', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/transfers/Sample Data/reversals')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/transfers/{id}/reversals', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/transfers/Sample Data/reversals')
            .send({
              "expand": [
                "Generated Value"
              ],
              "metadata": {
                "id": 468,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.927Z"
              },
              "refund_application_fee": true
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/transfers/Sample Data/reversals')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/transfers/{transfer}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/transfers/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/transfers/{transfer}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/transfers/Test String')
            .send({
              "metadata": {
                "id": 688,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.927Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/transfers/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/transfers/{transfer}/reversals/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/transfers/API Test Data/reversals/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/transfers/{transfer}/reversals/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/transfers/API Test Data/reversals/Sample Data')
            .send({
              "expand": [
                "Test String"
              ],
              "metadata": {
                "id": 971,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.927Z"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/transfers/API Test Data/reversals/Sample Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/treasury/credit_reversals', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/treasury/credit_reversals')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/treasury/credit_reversals', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/credit_reversals')
            .send({
              "expand": [
                "API Test Data",
                "Test String",
                "API Test Data"
              ],
              "metadata": {},
              "received_credit": "API Test Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/credit_reversals')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/treasury/credit_reversals/{credit_reversal}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/treasury/credit_reversals/Generated Value')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/treasury/debit_reversals', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/treasury/debit_reversals')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/treasury/debit_reversals', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/debit_reversals')
            .send({
              "expand": [
                "Test String"
              ],
              "metadata": {},
              "received_debit": "Sample Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/debit_reversals')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/treasury/debit_reversals/{debit_reversal}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/treasury/debit_reversals/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/treasury/financial_accounts', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/treasury/financial_accounts')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/treasury/financial_accounts', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/financial_accounts')
            .send({
              "expand": [
                "API Test Data"
              ],
              "metadata": {},
              "nickname": {
                "id": 600,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.927Z"
              },
              "supported_currencies": [
                "Test String"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/financial_accounts')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/treasury/financial_accounts/{financial_account}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/treasury/financial_accounts/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/treasury/financial_accounts/{financial_account}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/financial_accounts/Test String')
            .send({
              "expand": [
                "API Test Data",
                "Generated Value"
              ],
              "features": {
                "card_issuing": {
                  "requested": true
                },
                "deposit_insurance": {
                  "requested": false
                },
                "financial_addresses": {},
                "intra_stripe_flows": {
                  "requested": false
                },
                "outbound_transfers": {
                  "ach": {
                    "requested": false
                  },
                  "us_domestic_wire": {
                    "requested": true
                  }
                }
              },
              "nickname": {
                "id": 250,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.927Z"
              },
              "platform_restrictions": {
                "inbound_flows": "restricted"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/financial_accounts/Test String')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('POST /v1/treasury/financial_accounts/{financial_account}/close', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/financial_accounts/Test String/close')
            .send({
              "expand": [
                "Generated Value"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/financial_accounts/Test String/close')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/treasury/financial_accounts/{financial_account}/features', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/treasury/financial_accounts/API Test Data/features')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/treasury/financial_accounts/{financial_account}/features', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/financial_accounts/Sample Data/features')
            .send({
              "card_issuing": {
                "requested": false
              },
              "financial_addresses": {
                "aba": {
                  "requested": true
                }
              },
              "outbound_payments": {
                "ach": {
                  "requested": true
                },
                "us_domestic_wire": {
                  "requested": true
                }
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/financial_accounts/Sample Data/features')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/treasury/inbound_transfers', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/treasury/inbound_transfers')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/treasury/inbound_transfers', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/inbound_transfers')
            .send({
              "amount": 5,
              "currency": "Sample Data",
              "description": "Sample Data",
              "expand": [
                "Test String",
                "API Test Data",
                "Generated Value"
              ],
              "financial_account": "Generated Value",
              "metadata": {},
              "origin_payment_method": "Generated Value"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/inbound_transfers')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/treasury/inbound_transfers/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/treasury/inbound_transfers/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/treasury/inbound_transfers/{inbound_transfer}/cancel', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/inbound_transfers/Generated Value/cancel')
            .send({
              "expand": [
                "API Test Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/inbound_transfers/Generated Value/cancel')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/treasury/outbound_payments', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/treasury/outbound_payments')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/treasury/outbound_payments', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/outbound_payments')
            .send({
              "amount": 111,
              "currency": "API Test Data",
              "description": "Test String",
              "destination_payment_method_options": {
                "us_bank_account": {
                  "id": 152,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.928Z"
                }
              },
              "expand": [
                "Generated Value",
                "Sample Data"
              ],
              "financial_account": "Generated Value",
              "metadata": {},
              "statement_descriptor": "API Test Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/outbound_payments')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/treasury/outbound_payments/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/treasury/outbound_payments/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/treasury/outbound_payments/{id}/cancel', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/outbound_payments/Sample Data/cancel')
            .send({
              "expand": [
                "API Test Data"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/outbound_payments/Sample Data/cancel')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/treasury/outbound_transfers', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/treasury/outbound_transfers')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/treasury/outbound_transfers', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/outbound_transfers')
            .send({
              "amount": 896,
              "currency": "Test String",
              "destination_payment_method": "Sample Data",
              "destination_payment_method_data": {
                "financial_account": "Generated Value",
                "type": "financial_account"
              },
              "destination_payment_method_options": {
                "us_bank_account": {
                  "id": 4,
                  "name": "Generated Test Data",
                  "status": "active",
                  "createdAt": "2025-08-14T09:47:07.928Z"
                }
              },
              "expand": [
                "Generated Value",
                "Test String",
                "Sample Data"
              ],
              "financial_account": "Sample Data",
              "metadata": {},
              "statement_descriptor": "Generated Value"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/outbound_transfers')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/treasury/outbound_transfers/{outbound_transfer}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/treasury/outbound_transfers/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/treasury/outbound_transfers/{outbound_transfer}/cancel', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/outbound_transfers/API Test Data/cancel')
            .send({
              "expand": [
                "API Test Data",
                "Sample Data",
                "Generated Value"
              ]
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/treasury/outbound_transfers/API Test Data/cancel')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/treasury/received_credits', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/treasury/received_credits')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/treasury/received_credits/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/treasury/received_credits/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/treasury/received_debits', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/treasury/received_debits')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/treasury/received_debits/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/treasury/received_debits/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/treasury/transaction_entries', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/treasury/transaction_entries')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/treasury/transaction_entries/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/treasury/transaction_entries/API Test Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/treasury/transactions', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/treasury/transactions')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/treasury/transactions/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/treasury/transactions/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('GET /v1/webhook_endpoints', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/webhook_endpoints')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/webhook_endpoints', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/webhook_endpoints')
            .send({
              "api_version": "2015-09-23",
              "connect": false,
              "enabled_events": [
                "invoice.created"
              ],
              "expand": [
                "API Test Data",
                "API Test Data",
                "Test String"
              ],
              "metadata": {
                "id": 319,
                "name": "Generated Test Data",
                "status": "active",
                "createdAt": "2025-08-14T09:47:07.928Z"
              },
              "url": "API Test Data"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/webhook_endpoints')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /v1/webhook_endpoints/{webhook_endpoint}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/v1/webhook_endpoints/Test String')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /v1/webhook_endpoints/{webhook_endpoint}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/v1/webhook_endpoints/Sample Data')
            .send({
              "disabled": true,
              "enabled_events": [
                "charge.updated",
                "terminal.reader.action_failed",
                "account.updated"
              ],
              "expand": [
                "Sample Data"
              ],
              "url": "Generated Value"
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/v1/webhook_endpoints/Sample Data')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('DELETE /v1/webhook_endpoints/{webhook_endpoint}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/v1/webhook_endpoints/Sample Data')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
});

