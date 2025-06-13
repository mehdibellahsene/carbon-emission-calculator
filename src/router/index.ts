import { RouteRecordRaw } from 'vue-router'
import BusinessTravel from '../views/BusinessTravel.vue'
import IntermodalFreight from '../views/IntermodalFreight.vue'
import CloudCpu from '../views/CloudCpu.vue'
import CloudStorage from '../views/CloudStorage.vue'
import CloudMemory from '../views/CloudMemory.vue'
import CarbonHistory from '../views/CarbonHistory.vue'
import Login from '../views/Login.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'business-travel',
    component: BusinessTravel,
    meta: { title: 'Business Travel' }
  },
  {
    path: '/intermodal-freight',
    name: 'intermodal-freight',
    component: IntermodalFreight,
    meta: { title: 'Intermodal Freight' }
  },
  {
    path: '/cloud-cpu',
    name: 'cloud-cpu',
    component: CloudCpu,
    meta: { title: 'Cloud Computing - CPU' }
  },
  {
    path: '/cloud-storage',
    name: 'cloud-storage',
    component: CloudStorage,
    meta: { title: 'Cloud Computing - Storage' }
  },  {
    path: '/cloud-memory',
    name: 'cloud-memory',
    component: CloudMemory,
    meta: { title: 'Cloud Computing - Memory' }
  },
  {
    path: '/carbon-history',
    name: 'carbon-history',
    component: CarbonHistory,
    meta: { title: 'Carbon History & Analytics' }
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { title: 'Login', hideNavigation: true }
  }
]

export default routes