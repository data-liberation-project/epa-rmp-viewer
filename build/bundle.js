
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.55.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/State.svelte generated by Svelte v3.55.1 */

    const file$4 = "src/components/State.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (12:8) {#each county.facilities as fac}
    function create_each_block_1$1(ctx) {
    	let li;
    	let a;
    	let t0_value = /*fac*/ ctx[4].name + "";
    	let t0;
    	let a_href_value;
    	let t1;
    	let t2_value = /*fac*/ ctx[4].city + "";
    	let t2;
    	let t3;
    	let t4_value = /*fac*/ ctx[4].address + "";
    	let t4;
    	let t5;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = text(" (");
    			t2 = text(t2_value);
    			t3 = text(" • ");
    			t4 = text(t4_value);
    			t5 = text(")");
    			attr_dev(a, "href", a_href_value = "#/facility:" + /*fac*/ ctx[4].EPAFacilityID);
    			add_location(a, file$4, 13, 12, 355);
    			add_location(li, file$4, 12, 10, 338);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t0);
    			append_dev(li, t1);
    			append_dev(li, t2);
    			append_dev(li, t3);
    			append_dev(li, t4);
    			append_dev(li, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && t0_value !== (t0_value = /*fac*/ ctx[4].name + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*item*/ 1 && a_href_value !== (a_href_value = "#/facility:" + /*fac*/ ctx[4].EPAFacilityID)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*item*/ 1 && t2_value !== (t2_value = /*fac*/ ctx[4].city + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*item*/ 1 && t4_value !== (t4_value = /*fac*/ ctx[4].address + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(12:8) {#each county.facilities as fac}",
    		ctx
    	});

    	return block;
    }

    // (9:4) {#each item.counties as county}
    function create_each_block$3(ctx) {
    	let h3;
    	let t0_value = /*county*/ ctx[1].name + "";
    	let t0;
    	let t1;
    	let ul;
    	let t2;
    	let each_value_1 = /*county*/ ctx[1].facilities;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			add_location(h3, file$4, 9, 6, 232);
    			attr_dev(ul, "id", "facilities-list");
    			add_location(ul, file$4, 10, 6, 261);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(ul, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && t0_value !== (t0_value = /*county*/ ctx[1].name + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*item*/ 1) {
    				each_value_1 = /*county*/ ctx[1].facilities;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(9:4) {#each item.counties as county}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let section;
    	let h2;
    	let t0;
    	let t1_value = /*item*/ ctx[0].name + "";
    	let t1;
    	let t2;
    	let h4;
    	let a;
    	let t4;
    	let div;
    	let each_value = /*item*/ ctx[0].counties;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			h2 = element("h2");
    			t0 = text("Facilities in ");
    			t1 = text(t1_value);
    			t2 = space();
    			h4 = element("h4");
    			a = element("a");
    			a.textContent = "View all states";
    			t4 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h2, file$4, 5, 2, 73);
    			attr_dev(a, "href", "#/list:states");
    			add_location(a, file$4, 6, 6, 114);
    			add_location(h4, file$4, 6, 2, 110);
    			attr_dev(div, "id", "counties-list");
    			add_location(div, file$4, 7, 2, 165);
    			attr_dev(section, "id", "state-facilities");
    			add_location(section, file$4, 4, 0, 39);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(section, t2);
    			append_dev(section, h4);
    			append_dev(h4, a);
    			append_dev(section, t4);
    			append_dev(section, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*item*/ 1 && t1_value !== (t1_value = /*item*/ ctx[0].name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*item*/ 1) {
    				each_value = /*item*/ ctx[0].counties;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('State', slots, []);
    	let { item } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (item === undefined && !('item' in $$props || $$self.$$.bound[$$self.$$.props['item']])) {
    			console.warn("<State> was created without expected prop 'item'");
    		}
    	});

    	const writable_props = ['item'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<State> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({ item });

    	$$self.$inject_state = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item];
    }

    class State extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "State",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get item() {
    		throw new Error("<State>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<State>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Facility.svelte generated by Svelte v3.55.1 */

    const file$3 = "src/components/Facility.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (12:34) {#if item.lng}
    function create_if_block$2(ctx) {
    	let t0_value = (/*item*/ ctx[0].lng || "") + "";
    	let t0;
    	let t1;
    	let t2_value = (/*item*/ ctx[0].lat || "") + "";
    	let t2;
    	let t3;
    	let a0;
    	let t4;
    	let a0_href_value;
    	let t5;
    	let a1;
    	let t6;
    	let a1_href_value;
    	let t7;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text(", ");
    			t2 = text(t2_value);
    			t3 = text(" (");
    			a0 = element("a");
    			t4 = text("OSM");
    			t5 = text(" | ");
    			a1 = element("a");
    			t6 = text("Google");
    			t7 = text(")");
    			attr_dev(a0, "href", a0_href_value = "https://www.openstreetmap.org/?zoom=14&mlat=" + /*item*/ ctx[0].lat + "&mlon=" + /*item*/ ctx[0].lng);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "rel", "noreferrer");
    			add_location(a0, file$3, 11, 84, 608);
    			attr_dev(a1, "href", a1_href_value = "https://maps.google.com/maps?q=loc:" + /*item*/ ctx[0].lat + "," + /*item*/ ctx[0].lng);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "rel", "noreferrer");
    			add_location(a1, file$3, 11, 208, 732);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, a0, anchor);
    			append_dev(a0, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, a1, anchor);
    			append_dev(a1, t6);
    			insert_dev(target, t7, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && t0_value !== (t0_value = (/*item*/ ctx[0].lng || "") + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*item*/ 1 && t2_value !== (t2_value = (/*item*/ ctx[0].lat || "") + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*item*/ 1 && a0_href_value !== (a0_href_value = "https://www.openstreetmap.org/?zoom=14&mlat=" + /*item*/ ctx[0].lat + "&mlon=" + /*item*/ ctx[0].lng)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*item*/ 1 && a1_href_value !== (a1_href_value = "https://maps.google.com/maps?q=loc:" + /*item*/ ctx[0].lat + "," + /*item*/ ctx[0].lng)) {
    				attr_dev(a1, "href", a1_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(a0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(a1);
    			if (detaching) detach_dev(t7);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(12:34) {#if item.lng}",
    		ctx
    	});

    	return block;
    }

    // (17:8) {#each item.submissions as sub}
    function create_each_block$2(ctx) {
    	let li;
    	let t0;
    	let a;
    	let t1_value = /*sub*/ ctx[1].id + "";
    	let t1;
    	let a_href_value;
    	let t2;
    	let t3_value = /*sub*/ ctx[1].date + "";
    	let t3;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text("#");
    			a = element("a");
    			t1 = text(t1_value);
    			t2 = text(" — ");
    			t3 = text(t3_value);
    			attr_dev(a, "href", a_href_value = "#/submission:" + /*sub*/ ctx[1].id);
    			add_location(a, file$3, 17, 15, 1201);
    			add_location(li, file$3, 17, 10, 1196);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, a);
    			append_dev(a, t1);
    			append_dev(li, t2);
    			append_dev(li, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && t1_value !== (t1_value = /*sub*/ ctx[1].id + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*item*/ 1 && a_href_value !== (a_href_value = "#/submission:" + /*sub*/ ctx[1].id)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*item*/ 1 && t3_value !== (t3_value = /*sub*/ ctx[1].date + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(17:8) {#each item.submissions as sub}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let section;
    	let h2;
    	let t0;
    	let t1_value = /*item*/ ctx[0].name + "";
    	let t1;
    	let t2;
    	let ul1;
    	let li0;
    	let b0;
    	let t4;
    	let span0;
    	let a0;
    	let t5_value = /*item*/ ctx[0].EPAFacilityID + "";
    	let t5;
    	let a0_href_value;
    	let t6;
    	let li1;
    	let b1;
    	let t8;
    	let span1;
    	let a1;
    	let t9_value = (/*item*/ ctx[0].state || "") + "";
    	let t9;
    	let a1_href_value;
    	let t10;
    	let li2;
    	let b2;
    	let t12;
    	let span2;
    	let t13_value = (/*item*/ ctx[0].city || "") + "";
    	let t13;
    	let t14;
    	let li3;
    	let b3;
    	let t16;
    	let span3;
    	let t17_value = (/*item*/ ctx[0].zip || "") + "";
    	let t17;
    	let t18;
    	let li4;
    	let b4;
    	let t20;
    	let span4;
    	let t21;
    	let li5;
    	let b5;
    	let t23;
    	let span5;
    	let t24_value = (/*item*/ ctx[0].company_1 || "") + "";
    	let t24;
    	let t25;
    	let li6;
    	let b6;
    	let t27;
    	let span6;
    	let t28_value = (/*item*/ ctx[0].company_2 || "") + "";
    	let t28;
    	let t29;
    	let li7;
    	let b7;
    	let t31;
    	let span7;
    	let t32_value = (/*item*/ ctx[0].operator || "") + "";
    	let t32;
    	let t33;
    	let li8;
    	let b8;
    	let ul0;
    	let if_block = /*item*/ ctx[0].lng && create_if_block$2(ctx);
    	let each_value = /*item*/ ctx[0].submissions;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			h2 = element("h2");
    			t0 = text("Facility: ");
    			t1 = text(t1_value);
    			t2 = space();
    			ul1 = element("ul");
    			li0 = element("li");
    			b0 = element("b");
    			b0.textContent = "EPA Facilty ID:";
    			t4 = space();
    			span0 = element("span");
    			a0 = element("a");
    			t5 = text(t5_value);
    			t6 = space();
    			li1 = element("li");
    			b1 = element("b");
    			b1.textContent = "State:";
    			t8 = space();
    			span1 = element("span");
    			a1 = element("a");
    			t9 = text(t9_value);
    			t10 = space();
    			li2 = element("li");
    			b2 = element("b");
    			b2.textContent = "City:";
    			t12 = space();
    			span2 = element("span");
    			t13 = text(t13_value);
    			t14 = space();
    			li3 = element("li");
    			b3 = element("b");
    			b3.textContent = "ZIP Code:";
    			t16 = space();
    			span3 = element("span");
    			t17 = text(t17_value);
    			t18 = space();
    			li4 = element("li");
    			b4 = element("b");
    			b4.textContent = "Coordinates:";
    			t20 = space();
    			span4 = element("span");
    			if (if_block) if_block.c();
    			t21 = space();
    			li5 = element("li");
    			b5 = element("b");
    			b5.textContent = "Company 1:";
    			t23 = space();
    			span5 = element("span");
    			t24 = text(t24_value);
    			t25 = space();
    			li6 = element("li");
    			b6 = element("b");
    			b6.textContent = "Company 2:";
    			t27 = space();
    			span6 = element("span");
    			t28 = text(t28_value);
    			t29 = space();
    			li7 = element("li");
    			b7 = element("b");
    			b7.textContent = "Operator:";
    			t31 = space();
    			span7 = element("span");
    			t32 = text(t32_value);
    			t33 = space();
    			li8 = element("li");
    			b8 = element("b");
    			b8.textContent = "RMP Submissions (ID — Date Validated by EPA):";
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h2, file$3, 5, 2, 65);
    			add_location(b0, file$3, 7, 8, 133);
    			attr_dev(a0, "href", a0_href_value = "https://echo.epa.gov/detailed-facility-report?fid=" + /*item*/ ctx[0].EPAFacilityID);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "rel", "noreferrer");
    			add_location(a0, file$3, 7, 37, 162);
    			add_location(span0, file$3, 7, 31, 156);
    			add_location(li0, file$3, 7, 4, 129);
    			add_location(b1, file$3, 8, 8, 321);
    			attr_dev(a1, "href", a1_href_value = "#/state:" + /*item*/ ctx[0].state);
    			add_location(a1, file$3, 8, 28, 341);
    			add_location(span1, file$3, 8, 22, 335);
    			add_location(li1, file$3, 8, 4, 317);
    			add_location(b2, file$3, 9, 8, 415);
    			add_location(span2, file$3, 9, 21, 428);
    			add_location(li2, file$3, 9, 4, 411);
    			add_location(b3, file$3, 10, 8, 472);
    			add_location(span3, file$3, 10, 25, 489);
    			add_location(li3, file$3, 10, 4, 468);
    			add_location(b4, file$3, 11, 8, 532);
    			add_location(span4, file$3, 11, 28, 552);
    			add_location(li4, file$3, 11, 4, 528);
    			add_location(b5, file$3, 12, 8, 869);
    			add_location(span5, file$3, 12, 26, 887);
    			add_location(li5, file$3, 12, 4, 865);
    			add_location(b6, file$3, 13, 8, 936);
    			add_location(span6, file$3, 13, 26, 954);
    			add_location(li6, file$3, 13, 4, 932);
    			add_location(b7, file$3, 14, 8, 1003);
    			add_location(span7, file$3, 14, 25, 1020);
    			add_location(li7, file$3, 14, 4, 999);
    			add_location(b8, file$3, 15, 8, 1068);
    			attr_dev(ul0, "id", "submission-list");
    			add_location(ul0, file$3, 15, 60, 1120);
    			add_location(li8, file$3, 15, 4, 1064);
    			attr_dev(ul1, "id", "facility-details");
    			add_location(ul1, file$3, 6, 2, 98);
    			attr_dev(section, "id", "facility");
    			add_location(section, file$3, 4, 0, 39);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(section, t2);
    			append_dev(section, ul1);
    			append_dev(ul1, li0);
    			append_dev(li0, b0);
    			append_dev(li0, t4);
    			append_dev(li0, span0);
    			append_dev(span0, a0);
    			append_dev(a0, t5);
    			append_dev(ul1, t6);
    			append_dev(ul1, li1);
    			append_dev(li1, b1);
    			append_dev(li1, t8);
    			append_dev(li1, span1);
    			append_dev(span1, a1);
    			append_dev(a1, t9);
    			append_dev(ul1, t10);
    			append_dev(ul1, li2);
    			append_dev(li2, b2);
    			append_dev(li2, t12);
    			append_dev(li2, span2);
    			append_dev(span2, t13);
    			append_dev(ul1, t14);
    			append_dev(ul1, li3);
    			append_dev(li3, b3);
    			append_dev(li3, t16);
    			append_dev(li3, span3);
    			append_dev(span3, t17);
    			append_dev(ul1, t18);
    			append_dev(ul1, li4);
    			append_dev(li4, b4);
    			append_dev(li4, t20);
    			append_dev(li4, span4);
    			if (if_block) if_block.m(span4, null);
    			append_dev(ul1, t21);
    			append_dev(ul1, li5);
    			append_dev(li5, b5);
    			append_dev(li5, t23);
    			append_dev(li5, span5);
    			append_dev(span5, t24);
    			append_dev(ul1, t25);
    			append_dev(ul1, li6);
    			append_dev(li6, b6);
    			append_dev(li6, t27);
    			append_dev(li6, span6);
    			append_dev(span6, t28);
    			append_dev(ul1, t29);
    			append_dev(ul1, li7);
    			append_dev(li7, b7);
    			append_dev(li7, t31);
    			append_dev(li7, span7);
    			append_dev(span7, t32);
    			append_dev(ul1, t33);
    			append_dev(ul1, li8);
    			append_dev(li8, b8);
    			append_dev(li8, ul0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul0, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*item*/ 1 && t1_value !== (t1_value = /*item*/ ctx[0].name + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*item*/ 1 && t5_value !== (t5_value = /*item*/ ctx[0].EPAFacilityID + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*item*/ 1 && a0_href_value !== (a0_href_value = "https://echo.epa.gov/detailed-facility-report?fid=" + /*item*/ ctx[0].EPAFacilityID)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*item*/ 1 && t9_value !== (t9_value = (/*item*/ ctx[0].state || "") + "")) set_data_dev(t9, t9_value);

    			if (dirty & /*item*/ 1 && a1_href_value !== (a1_href_value = "#/state:" + /*item*/ ctx[0].state)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*item*/ 1 && t13_value !== (t13_value = (/*item*/ ctx[0].city || "") + "")) set_data_dev(t13, t13_value);
    			if (dirty & /*item*/ 1 && t17_value !== (t17_value = (/*item*/ ctx[0].zip || "") + "")) set_data_dev(t17, t17_value);

    			if (/*item*/ ctx[0].lng) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(span4, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*item*/ 1 && t24_value !== (t24_value = (/*item*/ ctx[0].company_1 || "") + "")) set_data_dev(t24, t24_value);
    			if (dirty & /*item*/ 1 && t28_value !== (t28_value = (/*item*/ ctx[0].company_2 || "") + "")) set_data_dev(t28, t28_value);
    			if (dirty & /*item*/ 1 && t32_value !== (t32_value = (/*item*/ ctx[0].operator || "") + "")) set_data_dev(t32, t32_value);

    			if (dirty & /*item*/ 1) {
    				each_value = /*item*/ ctx[0].submissions;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Facility', slots, []);
    	let { item } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (item === undefined && !('item' in $$props || $$self.$$.bound[$$self.$$.props['item']])) {
    			console.warn("<Facility> was created without expected prop 'item'");
    		}
    	});

    	const writable_props = ['item'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Facility> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({ item });

    	$$self.$inject_state = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item];
    }

    class Facility extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Facility",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get item() {
    		throw new Error("<Facility>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Facility>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/AttrTable.svelte generated by Svelte v3.55.1 */

    const { Object: Object_1, console: console_1$1 } = globals;
    const file$2 = "src/components/AttrTable.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	const constants_0 = /*table*/ child_ctx[0][/*item_key*/ child_ctx[10]];
    	child_ctx[11] = constants_0;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[2] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	const constants_0 = /*table*/ child_ctx[0][/*item_key*/ child_ctx[10]];
    	child_ctx[11] = constants_0;
    	return child_ctx;
    }

    // (41:4) {#if sections[key]}
    function create_if_block_5(ctx) {
    	let h4;
    	let t_value = /*sections*/ ctx[3][/*key*/ ctx[1]] + "";
    	let t;
    	let if_block = /*i*/ ctx[2] > -1 && create_if_block_6(ctx);

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			t = text(t_value);
    			if (if_block) if_block.c();
    			attr_dev(h4, "class", "svelte-1shdo0g");
    			add_location(h4, file$2, 41, 6, 1234);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			append_dev(h4, t);
    			if (if_block) if_block.m(h4, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*key*/ 2 && t_value !== (t_value = /*sections*/ ctx[3][/*key*/ ctx[1]] + "")) set_data_dev(t, t_value);

    			if (/*i*/ ctx[2] > -1) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_6(ctx);
    					if_block.c();
    					if_block.m(h4, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(41:4) {#if sections[key]}",
    		ctx
    	});

    	return block;
    }

    // (42:25) {#if i > -1}
    function create_if_block_6(ctx) {
    	let t0;
    	let t1_value = /*i*/ ctx[2] + 1 + "";
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text(": #");
    			t1 = text(t1_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*i*/ 4 && t1_value !== (t1_value = /*i*/ ctx[2] + 1 + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(42:25) {#if i > -1}",
    		ctx
    	});

    	return block;
    }

    // (47:6) {#if !(keys_to_skip.indexOf(key) > -1 || item_keys_to_skip.indexOf(item_key) > -1)}
    function create_if_block_3$1(ctx) {
    	let show_if = /*item_key*/ ctx[10].slice(0, 1) !== "_";
    	let if_block_anchor;
    	let if_block = show_if && create_if_block_4$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*table*/ 1) show_if = /*item_key*/ ctx[10].slice(0, 1) !== "_";

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_4$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(47:6) {#if !(keys_to_skip.indexOf(key) > -1 || item_keys_to_skip.indexOf(item_key) > -1)}",
    		ctx
    	});

    	return block;
    }

    // (48:8) {#if item_key.slice(0, 1) !== "_"}
    function create_if_block_4$1(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*item_key*/ ctx[10] + "";
    	let t0;
    	let td0_data_key_value;
    	let t1;
    	let td1;
    	let raw_value = /*renderValue*/ ctx[6](/*key*/ ctx[1], /*item_key*/ ctx[10], /*val*/ ctx[11]) + "";
    	let td1_data_key_value;
    	let t2;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = space();
    			attr_dev(td0, "class", "left svelte-1shdo0g");
    			attr_dev(td0, "data-key", td0_data_key_value = /*item_key*/ ctx[10]);
    			add_location(td0, file$2, 49, 12, 1546);
    			attr_dev(td1, "class", "right svelte-1shdo0g");
    			attr_dev(td1, "data-key", td1_data_key_value = /*item_key*/ ctx[10]);
    			add_location(td1, file$2, 50, 12, 1611);
    			attr_dev(tr, "class", "svelte-1shdo0g");
    			add_location(tr, file$2, 48, 10, 1529);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			td1.innerHTML = raw_value;
    			append_dev(tr, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*table*/ 1 && t0_value !== (t0_value = /*item_key*/ ctx[10] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*table*/ 1 && td0_data_key_value !== (td0_data_key_value = /*item_key*/ ctx[10])) {
    				attr_dev(td0, "data-key", td0_data_key_value);
    			}

    			if (dirty & /*key, table*/ 3 && raw_value !== (raw_value = /*renderValue*/ ctx[6](/*key*/ ctx[1], /*item_key*/ ctx[10], /*val*/ ctx[11]) + "")) td1.innerHTML = raw_value;
    			if (dirty & /*table*/ 1 && td1_data_key_value !== (td1_data_key_value = /*item_key*/ ctx[10])) {
    				attr_dev(td1, "data-key", td1_data_key_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(48:8) {#if item_key.slice(0, 1) !== \\\"_\\\"}",
    		ctx
    	});

    	return block;
    }

    // (45:4) {#each Object.keys(table) as item_key}
    function create_each_block_3(ctx) {
    	let show_if = !(/*keys_to_skip*/ ctx[4].indexOf(/*key*/ ctx[1]) > -1 || /*item_keys_to_skip*/ ctx[5].indexOf(/*item_key*/ ctx[10]) > -1);
    	let if_block_anchor;
    	let if_block = show_if && create_if_block_3$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*key, table*/ 3) show_if = !(/*keys_to_skip*/ ctx[4].indexOf(/*key*/ ctx[1]) > -1 || /*item_keys_to_skip*/ ctx[5].indexOf(/*item_key*/ ctx[10]) > -1);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_3$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(45:4) {#each Object.keys(table) as item_key}",
    		ctx
    	});

    	return block;
    }

    // (59:4) {#if item_key.slice(0, 1) === "_"}
    function create_if_block$1(ctx) {
    	let show_if;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1$1, create_if_block_2$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (dirty & /*table*/ 1) show_if = null;
    		if (/*item_key*/ ctx[10] == "_exec_summary") return 0;
    		if (show_if == null) show_if = !!Array.isArray(/*val*/ ctx[11]);
    		if (show_if) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx, -1);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx, dirty);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(59:4) {#if item_key.slice(0, 1) === \\\"_\\\"}",
    		ctx
    	});

    	return block;
    }

    // (71:6) {:else}
    function create_else_block(ctx) {
    	let attrtable;
    	let current;

    	attrtable = new AttrTable({
    			props: {
    				table: /*val*/ ctx[11],
    				key: /*key*/ ctx[1] + ":" + /*item_key*/ ctx[10],
    				i: "-1"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(attrtable.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(attrtable, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const attrtable_changes = {};
    			if (dirty & /*table*/ 1) attrtable_changes.table = /*val*/ ctx[11];
    			if (dirty & /*key, table*/ 3) attrtable_changes.key = /*key*/ ctx[1] + ":" + /*item_key*/ ctx[10];
    			attrtable.$set(attrtable_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(attrtable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(attrtable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(attrtable, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(71:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (67:35) 
    function create_if_block_2$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_2 = /*val*/ ctx[11];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*table, Object, key*/ 3) {
    				each_value_2 = /*val*/ ctx[11];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(67:35) ",
    		ctx
    	});

    	return block;
    }

    // (60:6) {#if item_key == "_exec_summary"}
    function create_if_block_1$1(ctx) {
    	let div1;
    	let h4;
    	let t1;
    	let div0;
    	let t2;
    	let each_value_1 = /*val*/ ctx[11];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Executive Summary";
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			attr_dev(h4, "class", "svelte-1shdo0g");
    			add_location(h4, file$2, 61, 10, 1959);
    			attr_dev(div0, "class", "exec-summary svelte-1shdo0g");
    			add_location(div0, file$2, 62, 10, 1996);
    			attr_dev(div1, "class", "tablewrapper svelte-1shdo0g");
    			add_location(div1, file$2, 60, 8, 1922);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h4);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*table, Object*/ 1) {
    				each_value_1 = /*val*/ ctx[11];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(60:6) {#if item_key == \\\"_exec_summary\\\"}",
    		ctx
    	});

    	return block;
    }

    // (68:8) {#each val as entry, i}
    function create_each_block_2(ctx) {
    	let attrtable;
    	let current;

    	attrtable = new AttrTable({
    			props: {
    				table: /*entry*/ ctx[17],
    				key: /*key*/ ctx[1] + ":" + /*item_key*/ ctx[10],
    				i: /*i*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(attrtable.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(attrtable, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const attrtable_changes = {};
    			if (dirty & /*table*/ 1) attrtable_changes.table = /*entry*/ ctx[17];
    			if (dirty & /*key, table*/ 3) attrtable_changes.key = /*key*/ ctx[1] + ":" + /*item_key*/ ctx[10];
    			attrtable.$set(attrtable_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(attrtable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(attrtable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(attrtable, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(68:8) {#each val as entry, i}",
    		ctx
    	});

    	return block;
    }

    // (64:12) {#each val as row}
    function create_each_block_1(ctx) {
    	let t_value = /*row*/ ctx[14].SummaryText + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*table*/ 1 && t_value !== (t_value = /*row*/ ctx[14].SummaryText + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(64:12) {#each val as row}",
    		ctx
    	});

    	return block;
    }

    // (57:2) {#each Object.keys(table) as item_key}
    function create_each_block$1(ctx) {
    	let show_if = /*item_key*/ ctx[10].slice(0, 1) === "_";
    	let if_block_anchor;
    	let current;
    	let if_block = show_if && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*table*/ 1) show_if = /*item_key*/ ctx[10].slice(0, 1) === "_";

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*table*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(57:2) {#each Object.keys(table) as item_key}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let t0;
    	let table_1;
    	let t1;
    	let current;
    	let if_block = /*sections*/ ctx[3][/*key*/ ctx[1]] && create_if_block_5(ctx);
    	let each_value_3 = Object.keys(/*table*/ ctx[0]);
    	validate_each_argument(each_value_3);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_1[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value = Object.keys(/*table*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			table_1 = element("table");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(table_1, "class", "svelte-1shdo0g");
    			add_location(table_1, file$2, 43, 2, 1298);
    			attr_dev(div, "class", "tablewrapper top svelte-1shdo0g");
    			add_location(div, file$2, 39, 0, 1173);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, table_1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(table_1, null);
    			}

    			append_dev(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*sections*/ ctx[3][/*key*/ ctx[1]]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_5(ctx);
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*Object, table, renderValue, key, keys_to_skip, item_keys_to_skip*/ 115) {
    				each_value_3 = Object.keys(/*table*/ ctx[0]);
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_3(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(table_1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_3.length;
    			}

    			if (dirty & /*table, Object, key, Array*/ 3) {
    				each_value = Object.keys(/*table*/ ctx[0]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AttrTable', slots, []);
    	let { table, key, i } = $$props;
    	const key_parts = key.split(":");
    	const name = key_parts[key_parts.length - 1].replace(/^_/, "");
    	console.log(key);

    	const sections = {
    		"submission:_processes": "Processes",
    		"submission:_processes:_naics": "Process NAICS Code(s)",
    		"submission:_processes:_naics:_desc": "NAICS Code Description",
    		"submission:_processes:_chemicals": "Process Chemicals",
    		"submission:_processes:_chemicals:_chemical": "Chemical Information",
    		"submission:_processes:_chemicals:_flam_mix_chemicals": "Flammable Mixture Chemical",
    		"submission:_accidents": "Accidents",
    		"submission:_accidents:_chemicals": "Accident Chemicals"
    	};

    	const keys_to_skip = [];
    	const item_keys_to_skip = ["FacilityID"];

    	const linkers = {
    		"EPAFacilityID": val => `#/facility:${val}`,
    		"FacilityState": val => `#/state:${val}`
    	};

    	const renderValue = (key, item_key, val) => {
    		if (val === null) {
    			return "";
    		} else {
    			if (linkers[item_key]) {
    				const url = linkers[item_key](val);
    				return `<a href='${url}'>${val}</a>`;
    			} else {
    				return val;
    			}
    		}
    	};

    	$$self.$$.on_mount.push(function () {
    		if (table === undefined && !('table' in $$props || $$self.$$.bound[$$self.$$.props['table']])) {
    			console_1$1.warn("<AttrTable> was created without expected prop 'table'");
    		}

    		if (key === undefined && !('key' in $$props || $$self.$$.bound[$$self.$$.props['key']])) {
    			console_1$1.warn("<AttrTable> was created without expected prop 'key'");
    		}

    		if (i === undefined && !('i' in $$props || $$self.$$.bound[$$self.$$.props['i']])) {
    			console_1$1.warn("<AttrTable> was created without expected prop 'i'");
    		}
    	});

    	const writable_props = ['table', 'key', 'i'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<AttrTable> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('table' in $$props) $$invalidate(0, table = $$props.table);
    		if ('key' in $$props) $$invalidate(1, key = $$props.key);
    		if ('i' in $$props) $$invalidate(2, i = $$props.i);
    	};

    	$$self.$capture_state = () => ({
    		table,
    		key,
    		i,
    		key_parts,
    		name,
    		sections,
    		keys_to_skip,
    		item_keys_to_skip,
    		linkers,
    		renderValue
    	});

    	$$self.$inject_state = $$props => {
    		if ('table' in $$props) $$invalidate(0, table = $$props.table);
    		if ('key' in $$props) $$invalidate(1, key = $$props.key);
    		if ('i' in $$props) $$invalidate(2, i = $$props.i);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [table, key, i, sections, keys_to_skip, item_keys_to_skip, renderValue];
    }

    class AttrTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { table: 0, key: 1, i: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AttrTable",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get table() {
    		throw new Error("<AttrTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set table(value) {
    		throw new Error("<AttrTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get key() {
    		throw new Error("<AttrTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<AttrTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get i() {
    		throw new Error("<AttrTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set i(value) {
    		throw new Error("<AttrTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Submission.svelte generated by Svelte v3.55.1 */
    const file$1 = "src/components/Submission.svelte";

    function create_fragment$1(ctx) {
    	let section;
    	let h2;
    	let t0;
    	let t1_value = /*item*/ ctx[0].FacilityID + "";
    	let t1;
    	let t2;
    	let attrtable;
    	let current;

    	attrtable = new AttrTable({
    			props: {
    				table: /*item*/ ctx[0],
    				key: "submission",
    				i: "0"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			section = element("section");
    			h2 = element("h2");
    			t0 = text("Submission #");
    			t1 = text(t1_value);
    			t2 = space();
    			create_component(attrtable.$$.fragment);
    			add_location(h2, file$1, 6, 2, 113);
    			attr_dev(section, "id", "submission");
    			add_location(section, file$1, 5, 0, 85);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(section, t2);
    			mount_component(attrtable, section, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*item*/ 1) && t1_value !== (t1_value = /*item*/ ctx[0].FacilityID + "")) set_data_dev(t1, t1_value);
    			const attrtable_changes = {};
    			if (dirty & /*item*/ 1) attrtable_changes.table = /*item*/ ctx[0];
    			attrtable.$set(attrtable_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(attrtable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(attrtable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(attrtable);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Submission', slots, []);
    	let { item } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (item === undefined && !('item' in $$props || $$self.$$.bound[$$self.$$.props['item']])) {
    			console.warn("<Submission> was created without expected prop 'item'");
    		}
    	});

    	const writable_props = ['item'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Submission> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({ AttrTable, item });

    	$$self.$inject_state = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item];
    }

    class Submission extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Submission",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get item() {
    		throw new Error("<Submission>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Submission>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.55.1 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (82:0) {#if location.hash.length === 0}
    function create_if_block_4(ctx) {
    	let hr;
    	let t0;
    	let section;
    	let label;
    	let t2;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			hr = element("hr");
    			t0 = space();
    			section = element("section");
    			label = element("label");
    			label.textContent = "Open a submission:";
    			t2 = space();
    			input = element("input");
    			add_location(hr, file, 82, 0, 1965);
    			attr_dev(label, "for", "avatar");
    			add_location(label, file, 84, 2, 1996);
    			attr_dev(input, "accept", "application/json");
    			attr_dev(input, "id", "sub_file");
    			attr_dev(input, "name", "sub_file");
    			attr_dev(input, "type", "file");
    			add_location(input, file, 85, 2, 2045);
    			attr_dev(section, "id", "chooser");
    			add_location(section, file, 83, 0, 1971);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, label);
    			append_dev(section, t2);
    			append_dev(section, input);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_handler*/ ctx[4]),
    					listen_dev(input, "change", /*readJSON*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(section);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(82:0) {#if location.hash.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (97:0) {#if (app.view == "list" && app.view_arg == "states" && app.view_data) }
    function create_if_block_3(ctx) {
    	let section;
    	let h2;
    	let t1;
    	let ul;
    	let each_value = /*app*/ ctx[0].view_data.sort(func);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			h2 = element("h2");
    			h2.textContent = "Facilities by State";
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h2, file, 98, 4, 2300);
    			attr_dev(ul, "id", "states-list");
    			add_location(ul, file, 99, 4, 2333);
    			attr_dev(section, "id", "states");
    			add_location(section, file, 97, 2, 2274);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h2);
    			append_dev(section, t1);
    			append_dev(section, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*app*/ 1) {
    				each_value = /*app*/ ctx[0].view_data.sort(func);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(97:0) {#if (app.view == \\\"list\\\" && app.view_arg == \\\"states\\\" && app.view_data) }",
    		ctx
    	});

    	return block;
    }

    // (101:6) {#each app.view_data.sort((a, b) => a.name < b.name) as s}
    function create_each_block(ctx) {
    	let li;
    	let a;
    	let t0_value = /*s*/ ctx[10].name + "";
    	let t0;
    	let t1;
    	let t2_value = /*s*/ ctx[10].count + "";
    	let t2;
    	let t3;
    	let a_href_value;
    	let t4;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = text(" (");
    			t2 = text(t2_value);
    			t3 = text(")");
    			t4 = space();
    			attr_dev(a, "href", a_href_value = "#/state:" + /*s*/ ctx[10].abbr);
    			add_location(a, file, 102, 10, 2443);
    			add_location(li, file, 101, 8, 2428);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t0);
    			append_dev(a, t1);
    			append_dev(a, t2);
    			append_dev(a, t3);
    			append_dev(li, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*app*/ 1 && t0_value !== (t0_value = /*s*/ ctx[10].name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*app*/ 1 && t2_value !== (t2_value = /*s*/ ctx[10].count + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*app*/ 1 && a_href_value !== (a_href_value = "#/state:" + /*s*/ ctx[10].abbr)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(101:6) {#each app.view_data.sort((a, b) => a.name < b.name) as s}",
    		ctx
    	});

    	return block;
    }

    // (110:0) {#if app.view == "state" && app.view_data }
    function create_if_block_2(ctx) {
    	let state;
    	let current;

    	state = new State({
    			props: { item: /*app*/ ctx[0].view_data },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(state.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(state, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const state_changes = {};
    			if (dirty & /*app*/ 1) state_changes.item = /*app*/ ctx[0].view_data;
    			state.$set(state_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(state.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(state.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(state, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(110:0) {#if app.view == \\\"state\\\" && app.view_data }",
    		ctx
    	});

    	return block;
    }

    // (114:0) {#if app.view == "facility" && app.view_data }
    function create_if_block_1(ctx) {
    	let facility;
    	let current;

    	facility = new Facility({
    			props: { item: /*app*/ ctx[0].view_data },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(facility.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(facility, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const facility_changes = {};
    			if (dirty & /*app*/ 1) facility_changes.item = /*app*/ ctx[0].view_data;
    			facility.$set(facility_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(facility.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(facility.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(facility, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(114:0) {#if app.view == \\\"facility\\\" && app.view_data }",
    		ctx
    	});

    	return block;
    }

    // (118:0) {#if app.view == "submission" && app.view_data}
    function create_if_block(ctx) {
    	let submission;
    	let current;

    	submission = new Submission({
    			props: { item: /*app*/ ctx[0].view_data },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(submission.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(submission, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const submission_changes = {};
    			if (dirty & /*app*/ 1) submission_changes.item = /*app*/ ctx[0].view_data;
    			submission.$set(submission_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(submission.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(submission.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(submission, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(118:0) {#if app.view == \\\"submission\\\" && app.view_data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let hr;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = location.hash.length === 0 && create_if_block_4(ctx);
    	let if_block1 = /*app*/ ctx[0].view == "list" && /*app*/ ctx[0].view_arg == "states" && /*app*/ ctx[0].view_data && create_if_block_3(ctx);
    	let if_block2 = /*app*/ ctx[0].view == "state" && /*app*/ ctx[0].view_data && create_if_block_2(ctx);
    	let if_block3 = /*app*/ ctx[0].view == "facility" && /*app*/ ctx[0].view_data && create_if_block_1(ctx);
    	let if_block4 = /*app*/ ctx[0].view == "submission" && /*app*/ ctx[0].view_data && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "RMP Submission Viewer";
    			t1 = space();
    			div = element("div");
    			div.textContent = "❗Work in Progress • Use With Caution ❗";
    			t3 = space();
    			if (if_block0) if_block0.c();
    			t4 = space();
    			if (if_block1) if_block1.c();
    			t5 = space();
    			if (if_block2) if_block2.c();
    			t6 = space();
    			if (if_block3) if_block3.c();
    			t7 = space();
    			if (if_block4) if_block4.c();
    			t8 = space();
    			hr = element("hr");
    			add_location(h1, file, 78, 0, 1834);
    			attr_dev(div, "class", "warning svelte-1lmy0bf");
    			add_location(div, file, 79, 0, 1865);
    			add_location(hr, file, 121, 0, 2820);
    			attr_dev(main, "class", "svelte-1lmy0bf");
    			add_location(main, file, 77, 0, 1827);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div);
    			append_dev(main, t3);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t4);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t5);
    			if (if_block2) if_block2.m(main, null);
    			append_dev(main, t6);
    			if (if_block3) if_block3.m(main, null);
    			append_dev(main, t7);
    			if (if_block4) if_block4.m(main, null);
    			append_dev(main, t8);
    			append_dev(main, hr);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "hashchange", /*routeChange*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (location.hash.length === 0) if_block0.p(ctx, dirty);

    			if (/*app*/ ctx[0].view == "list" && /*app*/ ctx[0].view_arg == "states" && /*app*/ ctx[0].view_data) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					if_block1.m(main, t5);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*app*/ ctx[0].view == "state" && /*app*/ ctx[0].view_data) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*app*/ 1) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_2(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(main, t6);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*app*/ ctx[0].view == "facility" && /*app*/ ctx[0].view_data) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*app*/ 1) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_1(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(main, t7);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*app*/ ctx[0].view == "submission" && /*app*/ ctx[0].view_data) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty & /*app*/ 1) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(main, t8);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = (a, b) => a.name < b.name;

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	let app = {
    		view: null,
    		view_arg: null,
    		view_data: null
    	};

    	const resetApp = () => {
    		$$invalidate(0, app.view = null, app);
    		$$invalidate(0, app.view_arg = null, app);
    		$$invalidate(0, app.view_data = null, app);
    	};

    	let item;
    	let files;

    	const readJSON = () => {
    		if (files) {
    			for (const file of files) {
    				const reader = new FileReader();

    				reader.onload = function (e) {
    					$$invalidate(0, app.view_data = JSON.parse(reader.result), app);
    					$$invalidate(0, app.view = "submission", app);
    				};

    				reader.readAsText(file);
    			}
    		}
    	};

    	const urlTemplates = {
    		"list": kind => `./data/facilities/states.json`,
    		"state": state => `./data/facilities/by-state/${state}.json`,
    		"facility": fac_id => `./data/facilities/detail/${fac_id}.json`,
    		"submission": sub_id => `./data/submissions/${sub_id}.json`
    	};

    	const fetchViewData = (view, view_arg) => {
    		const url = urlTemplates[view](view_arg);

    		fetch(url).then(response => response.json()).then(data => {
    			$$invalidate(0, app.view_data = data, app);
    		}).catch(error => {
    			console.log(error);
    		});
    	};

    	const routeChange = () => {
    		resetApp();

    		if (location.hash.indexOf(":") < 0) ; else {
    			const match = location.hash.match(/^#\/([^:]+):([^:+]+)/);

    			if (match) {
    				$$invalidate(0, app.view = match[1], app);
    				$$invalidate(0, app.view_arg = match[2], app);
    				$$invalidate(0, app.view_data = null, app);
    				fetchCurrentView();
    			} else {
    				console.log("Could not parse location.hash: " + location.hash);
    			}
    		}
    	};

    	const fetchCurrentView = () => {
    		fetchViewData(app.view, app.view_arg);
    	};

    	routeChange();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		files = this.files;
    		$$invalidate(1, files);
    	}

    	$$self.$capture_state = () => ({
    		State,
    		Facility,
    		Submission,
    		app,
    		resetApp,
    		item,
    		files,
    		readJSON,
    		urlTemplates,
    		fetchViewData,
    		routeChange,
    		fetchCurrentView
    	});

    	$$self.$inject_state = $$props => {
    		if ('app' in $$props) $$invalidate(0, app = $$props.app);
    		if ('item' in $$props) item = $$props.item;
    		if ('files' in $$props) $$invalidate(1, files = $$props.files);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [app, files, readJSON, routeChange, input_change_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
      props: {},
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
