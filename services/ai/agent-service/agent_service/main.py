import asyncio
import grpc
from concurrent import futures

# Import the generated gRPC files
import agent_pb2
import agent_pb2_grpc

# Import LangGraph and other necessary libraries
from typing import TypedDict, List, Dict, Any
from fastmcp import FastMCP
from langchain_google_genai import ChatGoogleGenerativeAI

import uuid

# Client Imports
from agent_service.clients.product_lookup_client import product_lookup_client

class AgentState(TypedDict):
    user_query: str
    messages: List[Dict[str, Any]]
    cart: Dict[str, Any]
    tool_results: Dict[str, Any]

mcp = FastMCP(name="ShoppingAgent")

@mcp.tool
async def search_product(product_name: str) -> List[Dict[str, Any]]:
    """
    Searches for a product by name.

    Args:
        product_name: The name of the product to search for.

    Returns:
        A list of products that match the name.
    """
    # TODO: Implement the gRPC call to the product-read service.
    print(f"Searching for product: {product_name}")
    # For now, let's return some dummy data.
    return [
        {"id": "123", "name": "Red T-Shirt", "price": 15.99},
        {"id": "456", "name": "Blue Jeans", "price": 45.00},
    ]

@mcp.tool
def add_to_cart(product_id: str, quantity: int) -> Dict[str, Any]:
    """
    Adds a product to the shopping cart.

    Args:
        product_id: The ID of the product to add.
        quantity: The number of items to add.

    Returns:
        The updated state of the shopping cart.
    """
    # TODO: Implement the gRPC call to the cart-crud service.
    print(f"Adding {quantity} of product {product_id} to the cart.")
    # For now, let's return some dummy data.
    return {"items": [{"product_id": product_id, "quantity": quantity}]}

@mcp.tool
async def checkout() -> Dict[str, Any]:
    """
    Initiates the checkout process.

    Returns:
        A confirmation of the checkout process.
    """
    # TODO: Implement the gRPC call to the checkout-orchestrator service.
    print("Initiating checkout.")
    return {"status": "success", "message": "Checkout initiated."}

@mcp.tool
async def get_product_details(product_id: str) -> Dict[str, Any]:
    """
    Gets the details of a specific product.

    Args:
        product_id: The ID of the product.

    Returns:
        The details of the product.
    """
    print(f"Getting details for product {product_id}")

    details = await product_lookup_client.get_product_by_id(product_id)
    if details:
        print(f"Found product details: {details}")
        return details
    else:
        print(f"No details found for product {product_id}")
        return None


@mcp.tool
def update_cart(product_id: str, quantity: int) -> Dict[str, Any]:
    """
    Updates the quantity of a product in the shopping cart.

    Args:
        product_id: The ID of the product to update.
        quantity: The new quantity of the product.

    Returns:
        The updated state of the shopping cart.
    """
    # TODO: Implement the gRPC call to the cart-crud service.
    print(f"Updating quantity of product {product_id} to {quantity}.")
    return {"items": [{"product_id": product_id, "quantity": quantity}]}

@mcp.tool
def remove_from_cart(product_id: str) -> Dict[str, Any]:
    """
    Removes a product from the shopping cart.

    Args:
        product_id: The ID of the product to remove.

    Returns:
        The updated state of the shopping cart.
    """
    # TODO: Implement the gRPC call to the cart-crud service.
    print(f"Removing product {product_id} from the cart.")
    return {"items": []}

@mcp.tool
def view_cart() -> Dict[str, Any]:
    """
    Views the current state of the shopping cart.

    Returns:
        The current state of the shopping cart.
    """
    # TODO: Implement the gRPC call to the cart-crud service.
    print("Viewing cart.")
    return {"items": [{"product_id": "123", "quantity": 1}]}

# Initialize the model
# TODO: Get the API key from environment variables
llm = ChatGoogleGenerativeAI(model="gemini-pro")

from langchain_core.pydantic_v1 import create_model, Field
from langchain.tools import tool

def convert_fastmcp_to_langchain_tools(mcp: FastMCP) -> List[Any]:
    """Converts fastmcp tools to a format that LangChain can understand."""
    langchain_tools = []
    # mcp.schema is not available, so we will manually define the tools for now
    # This is a placeholder until fastmcp provides a schema

    # search_product
    search_product_model = create_model("search_product", product_name=(str, Field(..., description="The name of the product to search for.")))
    @tool(args_schema=search_product_model)
    def search_product_tool(**kwargs):
        """Searches for a product by name."""
        return search_product(**kwargs)
    langchain_tools.append(search_product_tool)

    # add_to_cart
    add_to_cart_model = create_model("add_to_cart", product_id=(str, Field(..., description="The ID of the product to add.")), quantity=(int, Field(..., description="The number of items to add.")))
    @tool(args_schema=add_to_cart_model)
    def add_to_cart_tool(**kwargs):
        """Adds a product to the shopping cart."""
        return add_to_cart(**kwargs)
    langchain_tools.append(add_to_cart_tool)

    # checkout
    @tool
    def checkout_tool(**kwargs):
        """Initiates the checkout process."""
        return checkout(**kwargs)
    langchain_tools.append(checkout_tool)

    # get_product_details
    get_product_details_model = create_model("get_product_details", product_id=(str, Field(..., description="The ID of the product.")))
    @tool(args_schema=get_product_details_model)
    def get_product_details_tool(**kwargs):
        """Gets the details of a specific product."""
        return get_product_details(**kwargs)
    langchain_tools.append(get_product_details_tool)

    # update_cart
    update_cart_model = create_model("update_cart", product_id=(str, Field(..., description="The ID of the product to update.")), quantity=(int, Field(..., description="The new quantity of the product.")))
    @tool(args_schema=update_cart_model)
    def update_cart_tool(**kwargs):
        """Updates the quantity of a product in the shopping cart."""
        return update_cart(**kwargs)
    langchain_tools.append(update_cart_tool)

    # remove_from_cart
    remove_from_cart_model = create_model("remove_from_cart", product_id=(str, Field(..., description="The ID of the product to remove.")))
    @tool(args_schema=remove_from_cart_model)
    def remove_from_cart_tool(**kwargs):
        """Removes a product from the shopping cart."""
        return remove_from_cart(**kwargs)
    langchain_tools.append(remove_from_cart_tool)

    # view_cart
    @tool
    def view_cart_tool(**kwargs):
        """Views the current state of the shopping cart."""
        return view_cart(**kwargs)
    langchain_tools.append(view_cart_tool)

    return langchain_tools


def agent(state: AgentState):
    """
    Invokes the agent to generate a response based on the current state.
    """
    messages = state["messages"]
    tools = convert_fastmcp_to_langchain_tools(mcp)
    response = llm.invoke(messages, tools=tools)
    return {"messages": [response]}

from langgraph.prebuilt import ToolExecutor

# Create the tool executor
tools = convert_fastmcp_to_langchain_tools(mcp)
tool_executor = ToolExecutor(tools)

def tool_executor_node(state: AgentState):
    """
    Executes the tools that the agent has decided to use.
    """
    last_message = state["messages"][-1]
    tool_call = last_message.tool_calls[0]
    # The ToolExecutor will automatically call the correct tool
    output = tool_executor.invoke(tool_call)
    return {"tool_results": output}

from langgraph.graph import StatefulGraph, END

# 1. Instantiate the graph
workflow = StatefulGraph(AgentState)

# 2. Add the nodes
workflow.add_node("agent", agent)
workflow.add_node("tool_executor", tool_executor_node)

# 3. Define the edges
workflow.set_entry_point("agent")

# This function decides what to do after the agent has been called
def should_continue(state: AgentState):
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        return "tool_executor"
    else:
        return END

workflow.add_conditional_edges(
    "agent",
    should_continue,
    {"tool_executor": "tool_executor", END: END}
)

workflow.add_edge("tool_executor", "agent")

# 4. Compile the graph
app = workflow.compile()


class AgentService(agent_pb2_grpc.AgentServiceServicer):
    async def ExecuteWorkflow(self, request, context):
        initial_state = AgentState(
            user_query = request.user_query,
            messages=[("human", request.user_query)],
            cart = {},
            tool_results = {}
        )

        workflow_id = str(uuid.uuid4())

        yield agent_pb2.ExecuteWorkflowResponse(
            workflow_started = agent_pb2.WorkflowStartedEvent(workflow_id=workflow_id)
        )

        last_tool_name = "unknown"

        try:
            async for step in app.astream(initial_state):
                if "agent" in step:
                    last_message = step["agent"]["messages"][-1]

                    if last_message.tool_calls:
                        tool_call = last_message.tool_calls[0]
                        last_tool_name = tool_call['name']

                        yield agent_pb2.ExecuteWorkflowResponse(
                            tool_started=agent_pb2.ToolStartedEvent(
                                tool_name=tool_call['name'],
                                # Convert the python dict to protobuf value
                                input = python_to_protobuf_value(tool_call['args'])
                            )
                        )
                    else:
                        yield agent_pb2.ExecuteWorkflowResponse(
                            workflow_ended=agent_pb2.WorkflowEndedEvent(
                                final_response=last_message.content
                            )
                        )
                elif "tool_executor" in step:
                    tool_output = None
                    for message in reversed(step["tool_executor"]["messages"]):
                        if isinstance(message, ToolMessage):
                            tool_output = message.content
                            break

                    # The tool just ran and we can access the tool output from the state if needed
                    yield agent_pb2.ExecuteWorkflowResponse(
                        tool_ended=agent_pb2.ToolEndedEvent(
                            tool_name=last_tool_name,
                            output = python_to_protobuf_value(tool_output)

                        )
                    )
        # 1. Get the user query from the request.
        # 2. Execute your LangGraph agent with the user query.
        # 3. As the agent executes, it will generate events.
        # 4. For each event, create an ExecuteWorkflowResponse message and yield it.
        #
        # For example:
        # yield agent_pb2.ExecuteWorkflowResponse(workflow_started=agent_pb2.WorkflowStartedEvent(workflow_id="..."))


async def serve():
    server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=10))
    agent_pb2_grpc.add_AgentServiceServicer_to_server(AgentService(), server)
    server.add_insecure_port('[::]:50050')
    await server.start()
    print("Server started on port 50050")
    await server.wait_for_termination()

if __name__ == '__main__':
    asyncio.run(serve())
