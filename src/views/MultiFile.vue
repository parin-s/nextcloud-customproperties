 /* eslint-disable */
<template>
 <div :class="{ 'icon-loading': loading }">
  <div v-show="!loading">
   <h3>{{ t('customproperties', 'Batch update meta properties') }}</h3>
   <div v-for="prop in properties" :key="prop.id" class="customproperty-form-group">
    <label :for="'property-'+prop.propertyname">{{ prop.propertylabel }}</label>
    <div class="customproperty-input-group">
     <input :id="'property-'+prop.propertyname"
      :type="prop.propertytype"
                        :ref="prop.propertyname"
      class="customproperty-form-control">
    </div>
   </div>
            <div v-if="updatingBatch">
                Loading...
            </div>
            <div v-else>
                <button @click="updatePropertyBatch">Apply</button>
            </div>
  </div>
 </div>
</template>

<script>
import { generateRemoteUrl, generateUrl } from '@nextcloud/router'
import axios from '@nextcloud/axios'
import { getCurrentUser } from '@nextcloud/auth'

export default {
 name: 'MultiFile',
 props: {
  files: {
   type: Array,
   default: () => [],
  },
 },
 data() {
   return {
   loading: true,
            updatingBatch: false,
   files_: this.files,
   properties: [],
  }
 },
 async mounted() {
  await this.update()
 },
 methods: {
  async update() {
   this.properties = await this.retrieveCustomProperties()
            this.loading = false
  },
  async retrieveCustomProperties() {
   try {
    const customPropertiesUrl = generateUrl('/apps/customproperties/customproperties')
    const customPropertiesResponse = await axios.get(customPropertiesUrl)
    return customPropertiesResponse.data
   } catch (e) {
    console.error(e)
    return []
   }
  },
        async updatePropertyBatch(){
            this.updatingBatch = true
            for(let file of this.files_){
                for(let prop of this.properties){
                    let val = this.$refs[prop.propertyname].value
                    await updateProperty(prop,file,val)
                }
            }
            this.updatingBatch = false
        },
  async updateProperty(property,file,value) {
   const uid = getCurrentUser().uid
   const path = `/files/${uid}/${file.path}/${file.name}`.replace(/\/+/ig, '/')
   const url = generateRemoteUrl('dav') + path
   const propTag = ${property.prefix}:${property.propertyname}
   try {
    await axios.request({
     method: 'PROPPATCH',
     url,
     data: `
            <d:propertyupdate xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">
             <d:set>
               <d:prop>
                <${propTag}>${value}</${propTag}>
               </d:prop>
             </d:set>
            </d:propertyupdate>`,
    })
   } catch (e) {
    console.error(e)
   }
  },
 },
}
</script>

<style lang="scss">
.customproperty-input-group {
  display: flex;
  align-items: stretch;
}

.customproperty-input-group-append {
  display: flex;
  margin-left: -1px;
}

.customproperty-input-group-text {
  display: flex;
  align-items: center;
  padding: 0 1rem;
  margin-bottom: 0;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  color: #495057;
  text-align: center;
  white-space: nowrap;
  background-color: #e9ecef;
  border: 1px solid #ced4da;
  border-radius: .25rem;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.customproperty-form-control {
  flex: 1 1 auto;
  margin: 0 !important;
}

.customproperty-form-group {
  > label {
    display: block;
  }
}
</style>