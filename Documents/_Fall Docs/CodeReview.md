**1. Fixed the images-per-event setting.** In DeviceContext.tsx, IBDCCommunicationService.ts, and 
SimulatedIBDC.ts, the settings request was using imagesPerEventSetting, but the protocol expects imagesPerEvent. 
That meant the app and simulator were using the wrong field, so changing the setting wouldn't work. The request 
now uses the correct name, while device status keeps using imagesPerEventSetting. The sender also now has type and 
number validation to catch mistakes more easily.

**2. Cleaned up factory "tests".** In package.json, Jest was using its default discovery rules, which treated the 
factory files under __tests__ as "test suites". RideSessionFactory.ts and MockDataTestFactory.ts included placeholder 
tests just to avoid showing not real failures. That was always a bandaid and I got rid of that problem now. Jest now 
discovers only `.test` and `.spec` files. 

**3. Removed duplicate configuration entries.** In app.config.ts, the Android location permissions were each listed 
twice. This is likely from an automatic merge error fix. In tsconfig.json, the "types" property appeared twice with the 
same Jest value. Both files now contain one copy for each.

**4. Fixed midnight session error.** In SessionManager.ts, an event previously had to fall within 2 hours of the session 
start and on the same calendar day. That split a ride at midnight even when it was still inside the 2 hour window. 
Additionally, Session.test.ts used randomly generated session times, so its 2 hour boundary check could unexpectedly 
cross midnight and fail. I removed the same-day restriction and replaced the random test setup with a fixed value test.
There is a new test to specifically cover sessions going through midnight.

**5. Cleaned up dependency declarations.** In package.json, the app imported the expo-file-system and buffer dependencies 
without declaring them directly. They were depending on another package to install them, so I scrapped that in favor of a 
direct import. Testing packages were also mixed into the runtime dependencies. Updated package.json and the dependency 
lockfile to move testing tools into devDependencies.

**6. Improved incident completeness checks.** In Incident.ts, completeness previously checked whether coordinates were 
present and certain strings were not blank. It did not check whether coordinates were valid or the selected image actually 
existed in the incidents image list. That allowed invalid incidents to show as complete. The function now checks those 
conditions, and Incident.test.ts includes updated tests to verify this.

**7. Added selected-image ownership checking.** In IncidentDao.ts, updateIncidentBestImage() previously accepted any 
image ID and wrote it to the incident. It relied on the caller to provide the right image, so a coding mistake could select 
another incident’s photo or reference a nonexistent image. The update now checks that the image belongs to the incident 
and throws an error if the update cannot be made.

**8. Made database initialization shared.** In database.ts, opening the database and creating its tables were previously 
separate steps. A caller could receive the connection before setup finished, and simultaneous first calls could start 
multiple connection opens. This could cause failures during testing, such as querying a table that had not been created 
yet. All callers now wait for one shared initialization promise that includes connection configuration and table creation. 
Failed setup allows a later retry.

