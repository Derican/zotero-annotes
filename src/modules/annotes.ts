import { getLocaleID, getString } from "../utils/locale";

function example(
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor,
) {
  const original = descriptor.value;
  descriptor.value = function (...args: any) {
    try {
      ztoolkit.log(`Calling example ${target.name}.${String(propertyKey)}`);
      return original.apply(this, args);
    } catch (e) {
      ztoolkit.log(`Error in example ${target.name}.${String(propertyKey)}`, e);
      throw e;
    }
  };
  return descriptor;
}

export class AnnotesFactory {
  @example
  static registerNotifier() {
    const callback = {
      notify: async (
        event: string,
        type: string,
        ids: number[] | string[],
        extraData: { [key: string]: any },
      ) => {
        if (!addon?.data.alive) {
          this.unregisterNotifier(notifierID);
          return;
        }
        addon.hooks.onNotify(event, type, ids, extraData);
      },
    };

    // Register the callback in Zotero as an item observer
    const notifierID = Zotero.Notifier.registerObserver(callback, [
      "item",
    ]);

    Zotero.Plugins.addObserver({
      shutdown: ({ id }) => {
        if (id === addon.data.config.addonID)
          this.unregisterNotifier(notifierID);
      },
    });
  }

  @example
  static async exampleNotifierCallback(ids: Array<string | number>) {
    const item = await Zotero.Items.getAsync(ids[0]);
    if (!item) {
      ztoolkit.log("Item not found");
      return;
    }
    ztoolkit.log("Item found", item);
    if (!item.isAnnotation()) {
      return;
    }
    const parentItem = item.parentItem;
    if (parentItem) {
        const file = parentItem.parentItem;
        if (file){
            ztoolkit.log("Parent item found", file);
            const noteContent = item.annotationText;
            if (noteContent) {
                const note = new Zotero.Item('note');
                note.setNote(noteContent);
                note.parentID = file.id;
                await note.saveTx();
                Zotero.debug(`Note added: ${noteContent}`);
            }
        }
    }
  }

  @example
  private static unregisterNotifier(notifierID: string) {
    Zotero.Notifier.unregisterObserver(notifierID);
  }

  @example
  static registerPrefs() {
    Zotero.PreferencePanes.register({
      pluginID: addon.data.config.addonID,
      src: rootURI + "content/preferences.xhtml",
      label: getString("prefs-title"),
      image: `chrome://${addon.data.config.addonRef}/content/icons/favicon.png`,
    });
  }
}