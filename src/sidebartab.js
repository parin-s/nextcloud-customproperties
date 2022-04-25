/* eslint-disable */
import Vue from 'vue'
import {
	translate,
	translatePlural
} from '@nextcloud/l10n'
import {
	generateRemoteUrl,
	generateUrl
} from "@nextcloud/router";
import {
	getCurrentUser
} from "@nextcloud/auth";
import axios from "@nextcloud/axios";

import SidebarTab from './views/sidebar/SidebarTab'
import TabContent from './views/sidebar/TabContent'

window.addEventListener('DOMContentLoaded', () => {
	if (OCA.Files && OCA.Files.Sidebar) {
		let tab

		try {
			// Nextcloud 20
			tab = new OCA.Files.Sidebar.Tab('customproperties', SidebarTab)
		} catch (error) {
			// Nextcloud > 21
			Vue.prototype.t = translate
			Vue.prototype.n = translatePlural

			// Init Sharing tab component
			const View = Vue.extend(TabContent)
			let TabInstance = null

			tab = new OCA.Files.Sidebar.Tab({
				id: 'customproperties',
				name: t('customproperties', 'Properties'),
				icon: 'icon-info',

				async mount(el, fileInfo, context) {
					if (TabInstance) {
						TabInstance.$destroy()
					}
					TabInstance = new View({
						parent: context,
						data() {
							return {
								fileInfo_: fileInfo,
							}
						},
					})
					await TabInstance.updateFileInfo(fileInfo)
					TabInstance.$mount(el)
				},
				async update(fileInfo) {
					await TabInstance.updateFileInfo(fileInfo)
				},
				destroy() {
					TabInstance.$destroy()
					TabInstance = null
				},
			})
		}

		OCA.Files.Sidebar.registerTab(tab)
	}



	const MultiFilesPlugin = {
		attach(fileList) {
			fileList.registerMultiSelectFileAction({
				name: 'updatecustomprop',
				displayName: t('customproperties', 'Update meta properties'),
				iconClass: 'icon-edit',
				order: 20,
				action: async (files) => {
					const properties = await this.retrieveCustomProperties()
					const userId = getCurrentUser().uid

					const htmlProperties = this.createHtmlForCustomProperties(properties)

					window.OC.dialogs.confirmHtml(
						htmlProperties,
						t('customproperties', 'Update meta properties'),
						async (result, target) => {
							if (!result) {
								return
							}

							for (let file of files) {
								for (let prop of properties) {
									const element = document.querySelector(`#property-${prop.propertyname}`)
									const value = element.value
									if (value == '') {
										continue
									}
									await this.updateProperty(prop, file, value, userId);
								}
							}
						}).then(this.enhancePrompt)
				}
			})
		},
		enhancePrompt() {
			const dialog = document.querySelector('.oc-dialog')
			const input = dialog.querySelector('input[type=text]')
			const buttons = dialog.querySelectorAll('button')

			const icon = dialog.querySelector('.ui-icon')
			icon.parentNode.removeChild(icon)

			buttons[0].innerText = t('customproperties', 'Cancel')
			buttons[1].innerText = t('customproperties', 'Update data')
		},
		async retrieveCustomProperties() {
			try {
				const customPropertiesUrl = generateUrl(
					"/apps/customproperties/customproperties"
				)
				const customPropertiesResponse = await axios.get(customPropertiesUrl);
				return customPropertiesResponse.data;
			} catch (e) {
				console.error(e);
				return [];
			}
		},
		createHtmlForCustomProperties(properties) {
			return properties.reduce((html, prop) => {
				return html + `
				<div>
					<label for="property-${prop.propertyname}">${prop.propertylabel}</label>
					<div class="customproperty-input-group">
					<input
						id="property-${prop.propertyname}"
						type="${prop.propertytype}"
						class="customproperty-form-control"
					/>
					</div>
				</div>
				`
			}, '')
		},

		async updateProperty(property, file, value, userId) {
			const uid = userId
			const path = `/files/${uid}/${file.path}/${file.name}`.replace(
				/\/+/gi,
				"/"
			);
			const url = generateRemoteUrl("dav") + path;
			const propTag = `${property.prefix}:${property.propertyname}`;
			try {
				await axios.request({
					method: "PROPPATCH",
					url,
					data: `
				  <d:propertyupdate xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">
				   <d:set>
					 <d:prop>
					  <${propTag}>${value}</${propTag}>
					 </d:prop>
				   </d:set>
				  </d:propertyupdate>`,
				});
			} catch (e) {
				console.error(e);
			}
		},
	}
	OC.Plugins.register('OCA.Files.FileList', MultiFilesPlugin)
})