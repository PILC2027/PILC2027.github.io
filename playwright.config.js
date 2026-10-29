import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'ui.spec.js',timeout:45000,workers:2,use:{baseURL:'http://127.0.0.1:4173',headless:true},webServer:{command:'npm run dev',url:'http://127.0.0.1:4173',reuseExistingServer:true}});
