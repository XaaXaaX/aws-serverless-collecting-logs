import kinesis from './kinesis';

const MAX_BATCH_RECORDS_ITEMS = 5;
const dispatch = async (pendingItems: Record<string, any>[], immediate = false): Promise<void> => {

    console.debug(`[Extension] ${pendingItems.length} Pending to Dispatch `, );
    if (pendingItems.length !== 0 && (immediate || pendingItems.length >= MAX_BATCH_RECORDS_ITEMS)) {
        console.info(`[Extension] ${pendingItems.length} Dispatchable items `);
        const items: Record<string, any>[] = JSON.parse(JSON.stringify(pendingItems));
        pendingItems.splice(0); 
        await kinesis.sendsToKinesis(items);
        console.debug(`[Extension] Dispatched ${items.length} items`, );
    }
}

export default { dispatch }
