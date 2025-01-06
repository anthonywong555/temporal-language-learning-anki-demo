<script lang="ts">
    import Check from "lucide-svelte/icons/check";
    import ChevronsUpDown from "lucide-svelte/icons/chevrons-up-down";
    import * as Command from "$lib/components/ui/command";
    import * as Popover from "$lib/components/ui/popover";
    import { Button } from "$lib/components/ui/button";
    import { cn } from "$lib/utils.js";
    import { tick } from "svelte";

    export let items: string[] = [];
    export let defaultText: string = "Select an option...";
    export let noAvailableText: string = "No options available.";
    export let value: string;

    let open = false;
    let searchTerm = "";
    let customEntry = "";

    $: selectedValue =
        items.find((item) => item === value) ?? defaultText;

    function closeAndFocusTrigger(triggerId: string) {
        open = false;
        tick().then(() => {
            document.getElementById(triggerId)?.focus();
        });
    }

    function handleCustomInput() {
        if (customEntry && !items.includes(customEntry)) {
            items = [...items, customEntry];
            value = customEntry;
            searchTerm = "";
            closeAndFocusTrigger("custom-trigger");
        }
    }
</script>

<Popover.Root bind:open let:ids>
    <Popover.Trigger asChild let:builder>
        <Button
            builders={[builder]}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            class="w-[200px] justify-between"
        >
            {selectedValue}
            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
    </Popover.Trigger>
    <Popover.Content class="w-[200px] max-h-[200px] overflow-y-auto p-0">
        <Command.Root>
            <Command.Input 
                bind:value={searchTerm}
                placeholder="Search options..."
            />
            <Command.Empty>
                <div class="p-2">
                    <p>{noAvailableText}</p>
                    <input 
                        type="text" 
                        bind:value={customEntry} 
                        placeholder="Enter your own..." 
                        class="w-full mt-2 p-1 border rounded"
                        on:keydown={(e) => {
                            if (e.key === 'Enter') {
                                handleCustomInput();
                            }
                        }}
                    />
                </div>
            </Command.Empty>
            <Command.Group>
                {#each items as item}
                    <Command.Item
                        value={item}
                        onSelect={(currentValue) => {
                            value = currentValue;
                            closeAndFocusTrigger(ids.trigger);
                        }}
                    >
                        <Check
                            class={cn(
                                "mr-2 h-4 w-4",
                                value !== item && "text-transparent"
                            )}
                        />
                        {item}
                    </Command.Item>
                {/each}
            </Command.Group>
        </Command.Root>
    </Popover.Content>
</Popover.Root>
