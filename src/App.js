import { useRef, useState, useEffect } from "react"
import Papa from "papaparse"
import "./App.css"

export default function App() {
	const fileInputRef = useRef(null)

	const [selectedFile, setSelectedFile] = useState(null)
	const [employees, setEmployees] = useState([])
	const [projects, setProjects] = useState([])
	const [mostExperiencedPair, setMostExperiencedPair] = useState(null)

	function handleFileUpload(event) {
		const file = event.target.files[0]

		setSelectedFile(file)

		Papa.parse(file, {
			header: true,
			complete: result => setEmployees(result.data)
		})
	}

	useEffect(() => {
		if (employees.length > 0) {
			const updatedProjects = []

			for (let employee of employees) {
				if (Object.values(employee).length === 4) {
					const [EmpID, ProjectID, DateFrom, DateTo] = Object.values(employee)

					const existingProject = updatedProjects.find(
						project => project[ProjectID]
					)

					if (!existingProject) {
						updatedProjects.push({
							[ProjectID]: [{ EmpID, DateFrom, DateTo }]
						})
					} else {
						const projectEmployees = existingProject[ProjectID]

						const existingEmployee = projectEmployees.find(
							employee => employee.EmpID === EmpID
						)

						if (!existingEmployee) {
							projectEmployees.push({ EmpID, DateFrom, DateTo })
						}
					}
				}
			}

			setProjects(updatedProjects)
		}
	}, [employees])

	useEffect(() => {
		if (projects.length > 0) {
			const commonProjects = []

			for (let project of projects) {
				const ProjectID = Object.keys(project)[0]
				const employees = (Object.values(project).flat())

				for (let a = 0; a < employees.length; a++) {
					for (let b = a + 1; b < employees.length; b++) {
						if (employees[a].EmpID !== employees[b].EmpID) {
							const employeeA = employees[a]

							const ADateFrom = new Date(employeeA.DateFrom).getTime()

							const ADateTo = (employeeA.DateTo === "NULL"
								? new Date().getTime()
								: new Date(employeeA.DateTo).getTime()
							)

							const employeeB = employees[b]

							const BDateFrom = new Date(employeeB.DateFrom).getTime()

							const BDateTo = (employeeB.DateTo === "NULL"
								? new Date().getTime()
								: new Date(employeeB.DateTo).getTime()
							)

							const overlapStart = Math.max(ADateFrom, BDateFrom)
							const overlapEnd = Math.min(ADateTo, BDateTo)

							if (overlapStart <= overlapEnd) {
								commonProjects.push({
									EmployeeID1: employeeA.EmpID,
									EmployeeID2: employeeB.EmpID,
									ProjectID,
									DaysWorked: Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24))
								})
							}
						}
					}
				}
			}

			const pairs = []

			if (commonProjects.length > 0) {
				for (let commonProject of commonProjects) {
					const match = pairs.find(line =>
						(line.employees[0] === commonProject.EmployeeID1 &&
							line.employees[1] === commonProject.EmployeeID2
						) ||
						(line.employees[0] === commonProject.EmployeeID2 &&
							line.employees[1] === commonProject.EmployeeID1
						)
					)

					if (!match) {
						pairs.push({
							employees: [commonProject.EmployeeID1, commonProject.EmployeeID2],
							projects: [commonProject.ProjectID],
							daysWorked: [Number(commonProject.DaysWorked)]
						})
					} else {
						match.projects.push(commonProject.ProjectID)
						match.daysWorked.push(Number(commonProject.DaysWorked))
					}
				}
			}

			setMostExperiencedPair(pairs.sort(
				(a, b) => b.daysWorked.reduce((c, d) => c + d) - a.daysWorked.reduce((c, d) => c + d)
			)[0])
		}
	}, [projects])

	return (<div className="App">
		<h1>Most experienced pair of employees</h1>

		<input
			type="file"
			accept='.csv'
			onChange={handleFileUpload}
			ref={fileInputRef}
			className="fileInput"
			id="fileInput"
		/>

		<label htmlFor="fileInput" className='fileLabel'>Browse...</label>

		<p className="fileName">{selectedFile && selectedFile.name}</p>

		{mostExperiencedPair && <table>
			<thead>
				<tr>
					<th>Employee ID #1</th>
					<th>Employee ID #2</th>
					<th>Project ID</th>
					<th>Days worked</th>
				</tr>
			</thead>

			<tbody>
				{mostExperiencedPair.projects.map((project, index) => <tr key={index}>
					<td>{mostExperiencedPair.employees[0]}</td>
					<td>{mostExperiencedPair.employees[1]}</td>
					<td>{project}</td>
					<td>{mostExperiencedPair.daysWorked[index]}</td>
				</tr>)}
			</tbody>
		</table>}

		{mostExperiencedPair && <p className="summary">
			{mostExperiencedPair.employees[0]} and {mostExperiencedPair.employees[1]} worked together on {mostExperiencedPair.projects.length} projects for a total of {mostExperiencedPair.daysWorked.reduce((c, d) => c + d)} days.
		</p>}
	</div>)
}